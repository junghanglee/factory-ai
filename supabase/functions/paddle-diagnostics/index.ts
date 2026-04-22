// Paddle 진단: 승인 도메인 / 계정 verification 상태 조회
// Paddle API 키로 호출하므로 서버에서만 실행
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PADDLE_API_KEY = Deno.env.get("PADDLE_API_KEY") ?? "";
const PADDLE_CLIENT_TOKEN = Deno.env.get("PADDLE_CLIENT_TOKEN") ?? "";

function getPaddleApiBase(): string {
  // sandbox 키는 'pdl_sdbx_' 또는 'sdbx_' 등으로 시작
  const isSandbox =
    PADDLE_API_KEY.startsWith("pdl_sdbx_") ||
    PADDLE_API_KEY.startsWith("sdbx_") ||
    PADDLE_CLIENT_TOKEN.startsWith("test_");
  return isSandbox ? "https://sandbox-api.paddle.com" : "https://api.paddle.com";
}

async function paddleGet(path: string) {
  const base = getPaddleApiBase();
  const res = await fetch(`${base}${path}`, {
    headers: {
      Authorization: `Bearer ${PADDLE_API_KEY}`,
      "Content-Type": "application/json",
    },
  });
  const text = await res.text();
  let json: any = null;
  try { json = JSON.parse(text); } catch { /* ignore */ }
  return { status: res.status, ok: res.ok, body: json ?? text };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (!PADDLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "PADDLE_API_KEY가 설정되지 않았습니다." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const env = getPaddleApiBase().includes("sandbox") ? "sandbox" : "live";

    // 1) 비즈니스/계정 정보 — Paddle Billing API에는 직접적인
    //    라이브 웹사이트 승인 상태 조회 엔드포인트가 공개되어 있지 않다.
    //    따라서 API 키 유효성만 확인하고, 도메인 승인 자체는 대시보드 수동 확인으로 안내한다.
    const pingRes = await paddleGet("/event-types?per_page=1");

    return new Response(
      JSON.stringify({
        environment: env,
        client_token_prefix: PADDLE_CLIENT_TOKEN.slice(0, 8) || null,
        api_key_prefix: PADDLE_API_KEY.slice(0, 12),
        api_key_valid: pingRes.ok,
        api_key_error: pingRes.ok ? null : pingRes.body,
        approved_domains: {
          status: 501,
          ok: false,
          data: {
            error: {
              code: "dashboard_only",
              detail:
                "라이브 웹사이트 승인 상태는 공개 API로 조회/추가할 수 없어 Paddle 대시보드에서 직접 승인 요청해야 합니다.",
            },
          },
        },
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("paddle-diagnostics error:", e);
    return new Response(
      JSON.stringify({ error: String(e?.message ?? e) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
