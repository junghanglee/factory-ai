import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

const buildHeroMediaUrl = (supabaseUrl: string, imageUrl: string | null) => {
  if (!imageUrl) return null;

  try {
    const parsedUrl = new URL(imageUrl);
    const match = parsedUrl.pathname.match(/\/storage\/v1\/object\/public\/([^/]+)\/(.+)$/);

    if (!match) return imageUrl;

    const [, bucket, objectPath] = match;
    if (bucket !== "chat-files") return imageUrl;

    return `${supabaseUrl}/functions/v1/hero-media?bucket=${encodeURIComponent(bucket)}&path=${encodeURIComponent(objectPath)}`;
  } catch {
    return imageUrl;
  }
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data, error } = await supabase
      .from("banners")
      .select("*")
      .eq("active", true)
      .order("sort_order", { ascending: true });

    if (error) throw error;

    const banners = (data ?? []).map((banner) => ({
      ...banner,
      image_url: buildHeroMediaUrl(supabaseUrl, banner.image_url),
    }));

    return new Response(JSON.stringify({ banners }), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("hero-content error", error);

    return new Response(
      JSON.stringify({
        banners: [],
        fallback: true,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
        },
      },
    );
  }
});