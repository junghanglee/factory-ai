import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type DbCategory = Tables<"categories">;
export type DbService = Tables<"services">;
export type DbServicePackage = Tables<"service_packages">;
export type DbBanner = Tables<"banners">;

interface BannerResponse {
  banners: DbBanner[];
  error?: string;
  fallback?: boolean;
}

export const useBanners = () =>
  useQuery({
    queryKey: ["banners"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke<BannerResponse>("hero-content", {
        method: "GET",
      });

      if (error) throw error;

      return (data?.banners ?? []) as DbBanner[];
    },
    retry: 1,
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnReconnect: true,
  });

export const useCategories = () =>
  useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("sort_order");
      if (error) throw error;
      return data as DbCategory[];
    },
  });

export const useServices = (categoryId?: string) =>
  useQuery({
    queryKey: ["services", categoryId],
    queryFn: async () => {
      let query = supabase.from("services").select("*").order("created_at", { ascending: false });
      if (categoryId) query = query.eq("category_id", categoryId);
      const { data, error } = await query;
      if (error) throw error;
      return data as DbService[];
    },
  });

export const useService = (id?: string) =>
  useQuery({
    queryKey: ["service", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data as DbService;
    },
    enabled: !!id,
  });

export const useServicePackages = (serviceId?: string) =>
  useQuery({
    queryKey: ["service_packages", serviceId],
    queryFn: async () => {
      if (!serviceId) return [];
      const { data, error } = await supabase
        .from("service_packages")
        .select("*")
        .eq("service_id", serviceId)
        .order("sort_order");
      if (error) throw error;
      return data as DbServicePackage[];
    },
    enabled: !!serviceId,
  });

export const useAllServicesWithPackages = () =>
  useQuery({
    queryKey: ["services_with_packages"],
    queryFn: async () => {
      const { data: services, error: sErr } = await supabase
        .from("services")
        .select("*")
        .order("created_at", { ascending: false });
      if (sErr) throw sErr;

      const { data: packages, error: pErr } = await supabase
        .from("service_packages")
        .select("*")
        .order("sort_order");
      if (pErr) throw pErr;

      return (services as DbService[]).map((s) => ({
        ...s,
        packages: (packages as DbServicePackage[]).filter((p) => p.service_id === s.id),
      }));
    },
  });
