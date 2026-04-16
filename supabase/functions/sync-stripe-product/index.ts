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
    // Verify admin
    const authHeader = req.headers.get("authorization");
    if (!authHeader) throw new Error("Missing authorization header");
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) throw new Error("Unauthorized");

    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .in("role", ["admin", "super_admin"]);
    if (!roleData || roleData.length === 0) throw new Error("Admin access required");

    const body = await req.json();
    const { service_id, environment } = body;
    if (!service_id) {
      return new Response(JSON.stringify({ error: "service_id required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const env = (environment || "sandbox") as StripeEnv;
    const stripe = createStripeClient(env);

    // Fetch service and packages
    const { data: service, error: svcErr } = await supabase
      .from("services")
      .select("id, title, description, price, original_price")
      .eq("id", service_id)
      .single();
    if (svcErr || !service) throw new Error("Service not found");

    const { data: packages = [] } = await supabase
      .from("service_packages")
      .select("id, name, price, sort_order")
      .eq("service_id", service_id)
      .order("sort_order");

    // Product ID based on service UUID (stable across syncs)
    const productLookupKey = `svc_${service.id.replace(/-/g, "").slice(0, 16)}`;

    // Try to find existing product by metadata
    const existingProducts = await stripe.products.search({
      query: `metadata["service_id"]:"${service.id}"`,
    });

    let stripeProduct;
    if (existingProducts.data.length > 0) {
      // Update existing product
      stripeProduct = await stripe.products.update(existingProducts.data[0].id, {
        name: service.title,
        description: service.description || undefined,
        metadata: { service_id: service.id, lovable_external_id: productLookupKey },
      });
    } else {
      // Create new product
      stripeProduct = await stripe.products.create({
        name: service.title,
        description: service.description || undefined,
        metadata: { service_id: service.id, lovable_external_id: productLookupKey },
      });
    }

    // Sync prices for each package with price > 0
    const syncedPrices: any[] = [];
    const validPackages = (packages || []).filter((p: any) => p.price > 0);

    for (const pkg of validPackages) {
      const priceLookupKey = `pkg_${pkg.id.replace(/-/g, "").slice(0, 16)}`;

      // Check if price already exists with this lookup_key
      const existingPrices = await stripe.prices.list({ lookup_keys: [priceLookupKey] });

      if (existingPrices.data.length > 0) {
        const existing = existingPrices.data[0];
        // If amount changed, create new price and transfer lookup_key
        if (existing.unit_amount !== pkg.price) {
          await stripe.prices.create({
            product: stripeProduct.id,
            unit_amount: pkg.price,
            currency: "krw",
            lookup_key: priceLookupKey,
            transfer_lookup_key: true,
            metadata: {
              package_id: pkg.id,
              package_name: pkg.name,
              lovable_external_id: priceLookupKey,
            },
          });
          syncedPrices.push({ package: pkg.name, price: pkg.price, action: "updated" });
        } else {
          syncedPrices.push({ package: pkg.name, price: pkg.price, action: "unchanged" });
        }
      } else {
        // Create new price
        await stripe.prices.create({
          product: stripeProduct.id,
          unit_amount: pkg.price,
          currency: "krw",
          lookup_key: priceLookupKey,
          metadata: {
            package_id: pkg.id,
            package_name: pkg.name,
            lovable_external_id: priceLookupKey,
          },
        });
        syncedPrices.push({ package: pkg.name, price: pkg.price, action: "created" });
      }
    }

    return new Response(JSON.stringify({
      success: true,
      product_id: stripeProduct.id,
      prices: syncedPrices,
    }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("Sync error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});