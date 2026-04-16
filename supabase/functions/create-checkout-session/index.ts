import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { type StripeEnv, createStripeClient } from "../_shared/stripe.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Verify user
    const authHeader = req.headers.get("authorization");
    if (!authHeader) throw new Error("Missing authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) throw new Error("Unauthorized");

    const body = await req.json();
    const { project_id, amount, currency, service_title, return_url, environment, package_id } = body;

    if (!project_id || !service_title) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const env = (environment || "sandbox") as StripeEnv;
    const stripe = createStripeClient(env);

    // Try to resolve Stripe price via package_id lookup_key
    let lineItem: any;
    if (package_id) {
      const lookupKey = `pkg_${package_id.replace(/-/g, "").slice(0, 16)}`;
      const prices = await stripe.prices.list({ lookup_keys: [lookupKey] });
      if (prices.data.length > 0) {
        lineItem = { price: prices.data[0].id, quantity: 1 };
      }
    }

    // Fallback to price_data if no registered Stripe price found
    if (!lineItem) {
      if (!amount) {
        return new Response(JSON.stringify({ error: "Missing amount — no registered Stripe price found" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      lineItem = {
        price_data: {
          currency: currency || "krw",
          product_data: { name: service_title },
          unit_amount: amount,
        },
        quantity: 1,
      };
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      ui_mode: "embedded",
      line_items: [lineItem],
      metadata: {
        project_id,
        user_id: user.id,
        environment: env,
      },
      return_url: return_url || `${req.headers.get("origin")}/checkout/return?session_id={CHECKOUT_SESSION_ID}`,
    });

    return new Response(JSON.stringify({ clientSecret: session.client_secret }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Checkout session error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
