// Paddle Admin Proxy - 관리자 전용 Paddle API 호출
// GET /paddle-admin?resource=transactions|customers|adjustments|notifications|events&id=...&after=...&per_page=...
import { createClient } from "npm:@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const PADDLE_API_KEY = Deno.env.get("PADDLE_API_KEY") ?? "";
// PADDLE_API_KEY 가 live(pdl_live_) 면 라이브, sandbox(pdl_sdbx_) 면 샌드박스
const PADDLE_BASE = PADDLE_API_KEY.startsWith("pdl_sdbx_")
  ? "https://sandbox-api.paddle.com"
  : "https://api.paddle.com";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const ALLOWED_RESOURCES = new Set([
  "transactions",
  "customers",
  "adjustments",
  "notifications",
  "events",
  "products",
  "prices",
  "subscriptions",
]);

async function isAdmin(token: string): Promise<{ ok: boolean; reason?: string; uid?: string }> {
  try {
    const supa = createClient(SUPABASE_URL, SERVICE_ROLE, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: userRes, error: userErr } = await supa.auth.getUser(token);
    if (userErr) return { ok: false, reason: `auth: ${userErr.message}` };
    const uid = userRes.user?.id;
    if (!uid) return { ok: false, reason: "no user from token" };
    const { data, error } = await supa
      .from("user_roles")
      .select("role")
      .eq("user_id", uid)
      .in("role", ["admin", "super_admin"]);
    if (error) return { ok: false, reason: `roles: ${error.message}`, uid };
    return { ok: (data?.length ?? 0) > 0, uid, reason: data?.length ? undefined : "no admin role" };
  } catch (e) {
    return { ok: false, reason: e instanceof Error ? e.message : String(e) };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!PADDLE_API_KEY) {
      return json({ error: "PADDLE_API_KEY not configured" }, 500);
    }

    // Auth check (admin only)
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace(/^Bearer\s+/i, "");
    if (!token) return json({ error: "Unauthorized: missing bearer token" }, 401);
    const adminCheck = await isAdmin(token);
    console.log("admin check:", adminCheck);
    if (!adminCheck.ok) {
      return json({ error: "Forbidden", reason: adminCheck.reason, uid: adminCheck.uid }, 403);
    }

    const url = new URL(req.url);
    const resource = url.searchParams.get("resource") ?? "transactions";
    if (!ALLOWED_RESOURCES.has(resource)) {
      return json({ error: "Invalid resource" }, 400);
    }

    const id = url.searchParams.get("id");
    const after = url.searchParams.get("after");
    const perPage = url.searchParams.get("per_page") ?? "30";
    const status = url.searchParams.get("status");
    const include = url.searchParams.get("include");

    // Build Paddle URL
    let paddlePath = `/${resource}`;
    if (id) paddlePath += `/${encodeURIComponent(id)}`;

    const qs = new URLSearchParams();
    qs.set("per_page", perPage);
    if (after) qs.set("after", after);
    if (status) qs.set("status", status);
    if (include) qs.set("include", include);
    // Sort newest first when listing
    if (!id) qs.set("order_by", "created_at[DESC]");

    const paddleUrl = `${PADDLE_BASE}${paddlePath}?${qs.toString()}`;

    const resp = await fetch(paddleUrl, {
      headers: {
        Authorization: `Bearer ${PADDLE_API_KEY}`,
        "Content-Type": "application/json",
      },
    });

    const text = await resp.text();
    let body: unknown = text;
    try {
      body = JSON.parse(text);
    } catch (_) { /* keep text */ }

    return new Response(JSON.stringify({
      ok: resp.ok,
      status: resp.status,
      environment: PADDLE_BASE.includes("sandbox") ? "sandbox" : "live",
      data: body,
    }), {
      status: resp.ok ? 200 : resp.status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("paddle-admin error:", e);
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
