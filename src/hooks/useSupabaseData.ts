import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { getBannerDisplayImageUrl } from "@/lib/heroBanners";

export type DbCategory = Tables<"categories">;
export type DbService = Tables<"services">;
export type DbServicePackage = Tables<"service_packages">;
export type DbBanner = Tables<"banners">;

export const useBanners = () =>
  useQuery({
    queryKey: ["banners"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("banners")
        .select("*")
        .eq("active", true)
        .order("sort_order", { ascending: true });

      if (error) throw error;
      return (data ?? []).map((b) => ({
        ...b,
        image_url: getBannerDisplayImageUrl(b.image_url),
      })) as DbBanner[];
    },
    retry: 2,
    staleTime: 30_000,
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

      // Compute live service counts
      const { data: services } = await supabase
        .from("services")
        .select("category_id");
      const countMap: Record<string, number> = {};
      (services || []).forEach((s: any) => {
        if (s.category_id) countMap[s.category_id] = (countMap[s.category_id] || 0) + 1;
      });

      return (data as DbCategory[]).map(c => ({
        ...c,
        service_count: countMap[c.id] || 0,
      }));
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
