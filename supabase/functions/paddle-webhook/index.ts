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
    // 디버그: 실제 secret 값은 노출하지 않고 메타정보만 로깅
    const secretLen = NOTIFICATION_SECRET?.length ?? 0;
    const secretPrefix = NOTIFICATION_SECRET?.slice(0, 8) ?? "(none)";
    console.error("Paddle webhook: invalid signature", {
      hasSignature: !!signature,
      signatureSample: signature?.slice(0, 40),
      secretLen,
      secretPrefix,
      bodyLen: rawBody.length,
    });
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
      case "adjustment.created":
      case "adjustment.updated":
        await handleAdjustment(event.data);
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

/**
 * adjustment.created / adjustment.updated 처리
 * Paddle adjustment 객체: { id, action: 'refund'|'chargeback'|..., status, transaction_id, items[], totals: { total }, currency_code, reason }
 */
async function handleAdjustment(adj: any) {
  if (!adj?.id) return;

  // 환불(refund/chargeback)만 처리
  const action = adj.action as string | undefined;
  if (action !== "refund" && action !== "chargeback" && action !== "credit") {
    console.log("Skip non-refund adjustment:", action);
    return;
  }

  const transactionId = adj.transaction_id as string | undefined;
  if (!transactionId) {
    console.error("Adjustment without transaction_id:", adj.id);
    return;
  }

  // 원 결제 조회
  const { data: payment } = await supabase
    .from("payments")
    .select("id, project_id, user_id, amount, currency, refunded_amount")
    .eq("paddle_transaction_id", transactionId)
    .maybeSingle();

  if (!payment) {
    console.error("Payment not found for transaction:", transactionId);
    return;
  }

  const totalMinor = parseInt(adj.totals?.total ?? "0", 10);
  const currency = (adj.currency_code || payment.currency || "USD").toUpperCase();
  const status = adj.status as string | undefined; // pending_approval | approved | rejected | reversed

  // 우리 시스템 상태 매핑
  let mappedStatus = "pending";
  if (status === "approved") mappedStatus = "completed";
  else if (status === "rejected" || status === "reversed") mappedStatus = "failed";
  else if (status === "pending_approval") mappedStatus = "pending";

  // upsert (paddle_adjustment_id unique)
  const { data: existing } = await supabase
    .from("refunds")
    .select("id, status")
    .eq("paddle_adjustment_id", adj.id)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("refunds")
      .update({
        status: mappedStatus,
        paddle_status: status,
        processed_at: mappedStatus === "completed" ? new Date().toISOString() : null,
      })
      .eq("id", existing.id);
  } else {
    await supabase.from("refunds").insert({
      payment_id: payment.id,
      project_id: payment.project_id,
      user_id: payment.user_id,
      paddle_adjustment_id: adj.id,
      paddle_transaction_id: transactionId,
      amount: totalMinor,
      currency,
      reason: adj.reason ?? null,
      refund_type: action,
      status: mappedStatus,
      paddle_status: status,
      processed_at: mappedStatus === "completed" ? new Date().toISOString() : null,
    });
  }

  // 환불 완료 시 결제/프로젝트 상태 동기화
  if (mappedStatus === "completed") {
    const newRefunded = Number(payment.refunded_amount || 0) + totalMinor;
    const fullyRefunded = newRefunded >= Number(payment.amount || 0);

    await supabase
      .from("payments")
      .update({
        refunded_amount: newRefunded,
        refund_status: fullyRefunded ? "refunded" : "partially_refunded",
        status: fullyRefunded ? "refunded" : "completed",
      })
      .eq("id", payment.id);

    if (fullyRefunded) {
      await supabase
        .from("projects")
        .update({ payment_status: "환불", status: "취소" })
        .eq("id", payment.project_id);

      // 채팅방 시스템 메시지
      const { data: room } = await supabase
        .from("chat_rooms")
        .select("id")
        .eq("project_id", payment.project_id)
        .maybeSingle();
      if (room) {
        await supabase.from("chat_messages").insert({
          room_id: room.id,
          sender_id: payment.user_id || "00000000-0000-0000-0000-000000000000",
          message: "💸 결제가 환불되었습니다.",
          message_type: "system",
        });
        await supabase
          .from("chat_rooms")
          .update({
            last_message: "💸 결제가 환불되었습니다.",
            last_message_at: new Date().toISOString(),
          })
          .eq("id", room.id);
      }

      // 관리자 알림
      await supabase.from("admin_notifications").insert({
        title: "환불 완료",
        message: `Paddle 환불이 완료되었습니다 (${currency} ${(totalMinor / 100).toFixed(2)})`,
        type: "refund_completed",
        metadata: { project_id: payment.project_id, adjustment_id: adj.id },
      });
    }
  }

  console.log("Paddle adjustment processed:", adj.id, mappedStatus);
}
