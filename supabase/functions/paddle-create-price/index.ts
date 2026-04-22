// Paddle 동적 가격 생성 엣지 함수
// 호출 시 임시 product + non-catalog price를 만들어 price_id를 반환한다.
// Sandbox에서는 inline price가 막혀 있으므로 결제 직전 매번 호출한다.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const PADDLE_API_KEY = Deno.env.get("PADDLE_API_KEY")?.trim() ?? "";
const PADDLE_BASE = PADDLE_API_KEY.startsWith("pdl_sdbx_")
  ? "https://sandbox-api.paddle.com"
  : "https://api.paddle.com";

interface CreatePriceBody {
  amountUsd: number;
  productName: string;
  description?: string;
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function paddlePost(path: string, body: unknown) {
  const res = await fetch(`${PADDLE_BASE}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${PADDLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let parsed: unknown = text;
  try {
    parsed = JSON.parse(text);
  } catch {
    /* keep text */
  }
  return { ok: res.ok, status: res.status, body: parsed };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  if (!PADDLE_API_KEY) {
    return jsonResponse({ error: "PADDLE_API_KEY not configured" }, 500);
  }

  let payload: CreatePriceBody;
  try {
    payload = await req.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }

  const amountUsd = Number(payload?.amountUsd);
  const productName = payload?.productName?.trim();
  const description = payload?.description?.trim() || productName;

  if (!Number.isFinite(amountUsd) || amountUsd <= 0) {
    return jsonResponse({ error: "amountUsd must be a positive number" }, 400);
  }
  if (!productName) {
    return jsonResponse({ error: "productName is required" }, 400);
  }

  const amountCents = Math.round(amountUsd * 100).toString();

  // 1) Product 생성
  const productRes = await paddlePost("/products", {
    name: productName,
    tax_category: "standard",
    type: "standard",
  });

  if (!productRes.ok) {
    console.error("Paddle product create failed:", productRes);
    return jsonResponse(
      { error: "Failed to create product", detail: productRes.body },
      productRes.status,
    );
  }

  const productId = (productRes.body as { data?: { id?: string } })?.data?.id;
  if (!productId) {
    return jsonResponse({ error: "Product id missing", detail: productRes.body }, 500);
  }

  // 2) Non-catalog Price 생성
  const priceRes = await paddlePost("/prices", {
    product_id: productId,
    description,
    name: productName,
    type: "standard",
    tax_mode: "account_setting",
    quantity: { minimum: 1, maximum: 1 },
    unit_price: { amount: amountCents, currency_code: "USD" },
  });

  if (!priceRes.ok) {
    console.error("Paddle price create failed:", priceRes);
    return jsonResponse(
      { error: "Failed to create price", detail: priceRes.body },
      priceRes.status,
    );
  }

  const priceId = (priceRes.body as { data?: { id?: string } })?.data?.id;
  if (!priceId) {
    return jsonResponse({ error: "Price id missing", detail: priceRes.body }, 500);
  }

  return jsonResponse({
    priceId,
    productId,
    environment: PADDLE_BASE.includes("sandbox") ? "sandbox" : "live",
  });
});
