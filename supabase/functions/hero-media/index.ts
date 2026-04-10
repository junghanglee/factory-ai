import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

const allowedPrefixes = ["hero/", "banners/"];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const requestUrl = new URL(req.url);
    const bucket = requestUrl.searchParams.get("bucket") || "chat-files";
    const objectPath = requestUrl.searchParams.get("path");

    if (bucket !== "chat-files" || !objectPath) {
      return new Response(JSON.stringify({ error: "Invalid media request" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!allowedPrefixes.some((prefix) => objectPath.startsWith(prefix))) {
      return new Response(JSON.stringify({ error: "Unsupported media path" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data, error } = await supabase.storage.from(bucket).download(objectPath);
    if (error) throw error;

    return new Response(await data.arrayBuffer(), {
      headers: {
        ...corsHeaders,
        "Content-Type": data.type || "application/octet-stream",
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
      },
    });
  } catch (error) {
    console.error("hero-media error", error);

    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});