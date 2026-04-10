import type { Tables } from "@/integrations/supabase/types";

export type HeroBanner = Tables<"banners">;

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const HERO_MEDIA_ENDPOINT = `${SUPABASE_URL}/functions/v1/hero-media`;

export const getBannerDisplayImageUrl = (imageUrl?: string | null) => {
  if (!imageUrl) return null;

  try {
    const parsedUrl = new URL(imageUrl);
    const match = parsedUrl.pathname.match(/\/storage\/v1\/object\/public\/([^/]+)\/(.+)$/);

    if (!match) return imageUrl;

    const [, bucket, objectPath] = match;
    if (bucket !== "chat-files") return imageUrl;

    return `${HERO_MEDIA_ENDPOINT}?bucket=${encodeURIComponent(bucket)}&path=${encodeURIComponent(objectPath)}`;
  } catch {
    return imageUrl;
  }
};

export const createBannerUploadPath = (originalName: string) => {
  const ext = originalName.split(".").pop()?.toLowerCase() || "png";
  return `hero/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
};