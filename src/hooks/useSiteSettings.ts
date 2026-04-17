import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export type SiteSettings = {
  certified_sellers_enabled: boolean;
  [key: string]: any;
};

const DEFAULTS: SiteSettings = {
  certified_sellers_enabled: false,
};

/** Fetches all site_settings as a flat object. Cached for 10min. */
export function useSiteSettings() {
  const { isReady } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ["site_settings"],
    queryFn: async (): Promise<SiteSettings> => {
      const { data, error } = await supabase
        .from("site_settings" as any)
        .select("key, value");
      if (error) {
        console.warn("site_settings fetch failed", error);
        return DEFAULTS;
      }
      const map: SiteSettings = { ...DEFAULTS };
      (data || []).forEach((row: any) => {
        map[row.key] = row.value;
      });
      return map;
    },
    enabled: isReady,
    staleTime: 10 * 60 * 1000,
  });
  return { settings: data ?? DEFAULTS, isLoading };
}

/** Convenience hook for the single most-used flag. */
export function useFeatureFlag(key: keyof SiteSettings): boolean {
  const { settings } = useSiteSettings();
  return Boolean(settings[key]);
}
