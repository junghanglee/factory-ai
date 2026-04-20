// 관리자 전용: Paddle adjustment(환불) 생성
// POST { payment_id, reason, action: 'refund'|'credit', items?: [{ item_id, type:'full'|'partial', amount? }] }
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const PADDLE_API_KEY = Deno.env.get("PADDLE_API_KEY")!;
// Sandbox 키는 보통 sdbx_ 또는 pdl_sdbx_ 로 시작
const isSandbox = PADDLE_API_KEY.includes("sdbx") || PADDLE_API_KEY.startsWith("test_");
const PADDLE_BASE = isSandbox ? "https://sandbox-api.paddle.com" : "https://api.paddle.com";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  // 사용자 인증 확인 (관리자만)
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return json({ error: "Unauthorized" }, 401);

  const userClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );
  const { data: userRes } = await userClient.auth.getUser();
  const user = userRes?.user;
  if (!user) return json({ error: "Unauthorized" }, 401);

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // 관리자 권한 확인
  const { data: roleRow } = await admin
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .in("role", ["admin", "super_admin"])
    .maybeSingle();
  if (!roleRow) return json({ error: "Forbidden" }, 403);

  let body: any;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  const { payment_id, reason, action = "refund", refund_type = "full", amount } = body || {};
  if (!payment_id || !reason) return json({ error: "payment_id and reason required" }, 400);

  // 결제 조회
  const { data: payment, error: pErr } = await admin
    .from("payments")
    .select("*")
    .eq("id", payment_id)
    .maybeSingle();

  if (pErr || !payment) return json({ error: "Payment not found" }, 404);
  if (!payment.paddle_transaction_id) {
    return json({ error: "This payment has no Paddle transaction" }, 400);
  }

  // Paddle 트랜잭션의 items 가져오기 (item_id가 필요)
  const txRes = await fetch(`${PADDLE_BASE}/transactions/${payment.paddle_transaction_id}`, {
    headers: { Authorization: `Bearer ${PADDLE_API_KEY}` },
  });
  if (!txRes.ok) {
    const text = await txRes.text();
    console.error("Paddle tx fetch failed:", text);
    return json({ error: "Failed to fetch transaction from Paddle", detail: text }, 502);
  }
  const txData = await txRes.json();
  const items = (txData.data?.items || []) as Array<{ id: string; price?: { id: string } }>;
  if (!items.length) return json({ error: "Transaction has no items" }, 400);

  // adjustment items 구성
  const adjItems = items.map((it) => {
    if (refund_type === "partial" && amount) {
      // 부분 환불: 첫 항목에 금액 할당 (USD minor unit 문자열)
      return {
        item_id: it.id,
        type: "partial",
        amount: String(Math.round(Number(amount) * 100)),
      };
    }
    return { item_id: it.id, type: "full" };
  });

  // adjustment 생성
  const adjRes = await fetch(`${PADDLE_BASE}/adjustments`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${PADDLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      action, // refund | credit
      transaction_id: payment.paddle_transaction_id,
      reason,
      items: adjItems,
    }),
  });

  const adjData = await adjRes.json();
  if (!adjRes.ok) {
    console.error("Paddle adjustment failed:", adjData);
    return json({ error: "Paddle refund failed", detail: adjData }, 502);
  }

  const adj = adjData.data;
  const totalMinor = parseInt(adj.totals?.total ?? "0", 10);

  // refunds 테이블에 즉시 기록 (웹훅이 나중에 status를 업데이트)
  const { error: rErr } = await admin.from("refunds").insert({
    payment_id: payment.id,
    project_id: payment.project_id,
    user_id: payment.user_id,
    requested_by: user.id,
    paddle_adjustment_id: adj.id,
    paddle_transaction_id: payment.paddle_transaction_id,
    amount: totalMinor,
    currency: (adj.currency_code || payment.currency || "USD").toUpperCase(),
    reason,
    refund_type,
    status: adj.status === "approved" ? "completed" : "pending",
    paddle_status: adj.status,
    processed_at: adj.status === "approved" ? new Date().toISOString() : null,
  });
  if (rErr) console.error("DB insert refund error:", rErr);

  return json({ success: true, adjustment: adj });
});

function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
