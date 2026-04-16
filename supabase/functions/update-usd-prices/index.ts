import { corsHeaders } from "@supabase/supabase-js/cors";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch current KRW/USD rate
    const rateResp = await fetch("https://open.er-api.com/v6/latest/USD");
    const rateData = await rateResp.json();
    const rate = rateData.rates.KRW;

    if (!rate || rate <= 0) {
      throw new Error("Invalid exchange rate");
    }

    console.log(`Exchange rate: 1 USD = ${rate} KRW`);

    // Update services
    const { data: services, error: sErr } = await supabase
      .from("services")
      .select("id, price, original_price");

    if (sErr) throw sErr;

    for (const s of services || []) {
      const priceUsd = Math.round((s.price / rate) * 100) / 100;
      const origUsd = Math.round((s.original_price / rate) * 100) / 100;
      await supabase
        .from("services")
        .update({ price_usd: priceUsd, original_price_usd: origUsd })
        .eq("id", s.id);
    }

    // Update service packages
    const { data: packages, error: pErr } = await supabase
      .from("service_packages")
      .select("id, price");

    if (pErr) throw pErr;

    for (const p of packages || []) {
      const priceUsd = Math.round((p.price / rate) * 100) / 100;
      await supabase
        .from("service_packages")
        .update({ price_usd: priceUsd })
        .eq("id", p.id);
    }

    return new Response(
      JSON.stringify({
        success: true,
        rate,
        servicesUpdated: services?.length || 0,
        packagesUpdated: packages?.length || 0,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error updating USD prices:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
