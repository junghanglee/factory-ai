import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface ServiceReview {
  id: string;
  service_id: string;
  user_id: string | null;
  rating: number;
  review_text: string | null;
  nickname: string;
  image_url: string | null;
  is_admin_entry: boolean;
  created_at: string;
  updated_at: string;
}

export const useServiceReviews = (serviceId?: string) => {
  const { isReady } = useAuth();
  return useQuery({
    queryKey: ["service_reviews", serviceId],
    queryFn: async () => {
      if (!serviceId) return [];
      const { data, error } = await supabase
        .from("service_reviews")
        .select("*")
        .eq("service_id", serviceId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as ServiceReview[];
    },
    enabled: isReady && !!serviceId,
    staleTime: 2 * 60 * 1000,
  });
};

export const useRecentReviews = (limit = 6) => {
  const { isReady } = useAuth();
  return useQuery({
    queryKey: ["recent_reviews_random", limit],
    queryFn: async () => {
      // Fetch more reviews and pick random ones
      const { data, error } = await supabase
        .from("service_reviews")
        .select("*, services(title, thumbnail)")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      const all = data as (ServiceReview & { services: { title: string; thumbnail: string | null } | null })[];
      // Shuffle and pick `limit`
      const shuffled = [...all].sort(() => Math.random() - 0.5);
      return shuffled.slice(0, limit);
    },
    enabled: isReady,
    staleTime: 60 * 1000,
  });
};

export const useAllReviewsByService = (serviceId: string) => {
  const { isReady } = useAuth();
  return useQuery({
    queryKey: ["all_reviews_service", serviceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_reviews")
        .select("*")
        .eq("service_id", serviceId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as ServiceReview[];
    },
    enabled: isReady && !!serviceId,
    staleTime: 2 * 60 * 1000,
  });
};
