// Paddle webhook handler (transaction.completed 등)
// 검증: https://developer.paddle.com/webhooks/signature-verification
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const NOTIFICATION_SECRET = Deno.env.get("PADDLE_NOTIFICATION_SECRET")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, paddle-signature",
};

/** HMAC-SHA256으로 Paddle 서명 검증 */
async function verifyPaddleSignature(rawBody: string, signatureHeader: string | null): Promise<boolean> {
  if (!signatureHeader) return false;
  // 형식: ts=<timestamp>;h1=<hash>
  const parts = Object.fromEntries(
    signatureHeader.split(";").map((p) => p.split("=") as [string, string])
  );
  const ts = parts["ts"];
  const h1 = parts["h1"];
  if (!ts || !h1) return false;

  const payload = `${ts}:${rawBody}`;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(NOTIFICATION_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sigBuf = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  const computed = Array.from(new Uint8Array(sigBuf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  // 상수 시간 비교
  if (computed.length !== h1.length) return false;
  let diff = 0;
  for (let i = 0; i < computed.length; i++) {
    diff |= computed.charCodeAt(i) ^ h1.charCodeAt(i);
  }
  return diff === 0;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const rawBody = await req.text();
  const signature = req.headers.get("paddle-signature");

  const valid = await verifyPaddleSignature(rawBody, signature);
  if (!valid) {
    console.error("Paddle webhook: invalid signature");
    return new Response("Invalid signature", { status: 400 });
  }

  let event: any;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  console.log("Paddle event:", event.event_type);

  try {
    switch (event.event_type) {
      case "transaction.completed":
      case "transaction.paid":
        await handleTransactionCompleted(event.data);
        break;
      default:
        console.log("Unhandled event:", event.event_type);
    }
  } catch (e) {
    console.error("Webhook handler error:", e);
    return new Response("Handler error", { status: 500 });
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});

async function handleTransactionCompleted(tx: any) {
  const customData = tx.custom_data || {};
  const projectId = customData.project_id as string | undefined;
  const userId = customData.user_id as string | undefined;

  if (!projectId) {
    console.error("No project_id in custom_data");
    return;
  }

  // 중복 처리 방지
  const { data: existing } = await supabase
    .from("payments")
    .select("id")
    .eq("paddle_transaction_id", tx.id)
    .maybeSingle();
  if (existing) {
    console.log("Already processed:", tx.id);
    return;
  }

  // 총액 (Paddle은 minor unit 문자열로 반환, currency 기준)
  const totalMinor = parseInt(tx.details?.totals?.total ?? tx.payments?.[0]?.amount ?? "0", 10);
  const currency = (tx.currency_code || "USD").toLowerCase();

  await supabase.from("payments").insert({
    project_id: projectId,
    user_id: userId,
    paddle_transaction_id: tx.id,
    paddle_subscription_id: tx.subscription_id ?? null,
    paddle_customer_id: tx.customer_id ?? null,
    paddle_checkout_id: tx.checkout?.id ?? null,
    amount: totalMinor,
    currency,
    status: "completed",
    environment: tx.id?.startsWith("txn_01") ? "sandbox" : "live", // 보조 추정
    provider: "paddle",
  });

  // 프로젝트 상태 업데이트
  await supabase
    .from("projects")
    .update({ payment_status: "입금완료", status: "작업중" })
    .eq("id", projectId);

  // 정산 레코드
  const { data: project } = await supabase
    .from("projects")
    .select("seller_id, price")
    .eq("id", projectId)
    .single();

  if (project?.seller_id) {
    const { data: seller } = await supabase
      .from("seller_profiles")
      .select("commission_rate")
      .eq("id", project.seller_id)
      .maybeSingle();

    const rate = seller?.commission_rate ?? 10;
    const commissionAmount = Math.round((project.price * rate) / 100);

    await supabase.from("settlements").insert({
      seller_id: project.seller_id,
      project_id: projectId,
      order_amount: project.price,
      commission_rate: rate,
      commission_amount: commissionAmount,
      seller_amount: project.price - commissionAmount,
      status: "대기",
    });
  }

  // 채팅방 시스템 메시지
  const { data: room } = await supabase
    .from("chat_rooms")
    .select("id")
    .eq("project_id", projectId)
    .maybeSingle();

  if (room) {
    await supabase.from("chat_messages").insert({
      room_id: room.id,
      sender_id: userId || "00000000-0000-0000-0000-000000000000",
      message: "✅ 카드결제가 완료되었습니다. (Paddle)",
      message_type: "system",
    });
    await supabase
      .from("chat_rooms")
      .update({
        last_message: "✅ 카드결제가 완료되었습니다.",
        last_message_at: new Date().toISOString(),
      })
      .eq("id", room.id);
  }

  console.log("Paddle transaction processed:", tx.id);
}
