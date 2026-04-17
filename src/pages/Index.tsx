import { lazy, Suspense, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import MainLayout from "@/components/layout/MainLayout";
import HeroSection from "@/components/home/HeroSection";
import CategoryGrid from "@/components/home/CategoryGrid";
import PopularServices from "@/components/home/PopularServices";
import USPBanner from "@/components/home/USPBanner";
import LazyMount from "@/components/LazyMount";
import { useAuth } from "@/hooks/useAuth";

// Below-the-fold sections — code-split out of the initial bundle
const PortfolioGallery = lazy(() => import("@/components/home/PortfolioGallery"));
const RecentReviews = lazy(() => import("@/components/home/RecentReviews"));

const SectionFallback = ({ height = 300 }: { height?: number }) => (
  <div style={{ minHeight: height }} className="flex items-center justify-center">
    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
  </div>
);

const Index = () => {
  const queryClient = useQueryClient();
  const { isReady } = useAuth();

  // Prefetch above-the-fold data (categories) as soon as auth is ready,
  // so the data is warm before child components mount their queries.
  useEffect(() => {
    if (!isReady) return;
    queryClient.prefetchQuery({
      queryKey: ["categories"],
      queryFn: async () => {
        const { data, error } = await supabase
          .from("categories")
          .select("*")
          .order("sort_order");
        if (error) throw error;
        return data;
      },
      staleTime: 10 * 60 * 1000,
    });
  }, [isReady, queryClient]);

  return (
    <MainLayout>
      <HeroSection />
      <CategoryGrid />
      <PopularServices />
      <USPBanner />
      <LazyMount rootMargin="300px" minHeight={400}>
        <Suspense fallback={<SectionFallback height={400} />}>
          <RecentReviews />
        </Suspense>
      </LazyMount>
      <LazyMount rootMargin="300px" minHeight={500}>
        <Suspense fallback={<SectionFallback height={500} />}>
          <PortfolioGallery />
        </Suspense>
      </LazyMount>
    </MainLayout>
  );
};

export default Index;
