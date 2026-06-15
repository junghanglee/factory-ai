import { lazy, Suspense, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import MainLayout from "@/components/layout/MainLayout";
import HeroSection from "@/components/home/HeroSection";
import CategoryGrid from "@/components/home/CategoryGrid";
import PopularServices from "@/components/home/PopularServices";
import USPBanner from "@/components/home/USPBanner";
import LazyMount from "@/components/LazyMount";
import SEO from "@/components/SEO";
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
      <SEO
        title="AI 영상제작·웹툰제작 반값 | 링크투 AI팩토리"
        description="AI 영상제작·웹툰제작·콘텐츠제작을 한국 에이전시 대비 반값으로. 숙련된 해외 작업자의 자동화·대량생산으로 매우 저렴한 가격과 빠른 납기, 최적화된 품질을 보장합니다."
        path="/"
        jsonLd={[
          {
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: "링크투 AI팩토리",
            url: "https://linktofactory.com/",
            inLanguage: "ko-KR",
            potentialAction: {
              "@type": "SearchAction",
              target: "https://linktofactory.com/search?q={search_term_string}",
              "query-input": "required name=search_term_string",
            },
          },
          {
            "@context": "https://schema.org",
            "@type": "Service",
            serviceType: "AI 영상·웹툰·콘텐츠 제작 외주",
            provider: { "@type": "Organization", name: "링크투 AI팩토리", url: "https://linktofactory.com/" },
            areaServed: "South Korea",
            description:
              "AI 영상제작·웹툰제작·광고·이미지·챗봇 구축을 숙련된 해외 작업자와 자동화 워크플로우로 대량 생산. 한국 에이전시 대비 약 50% 반값 가격과 빠른 납기를 제공합니다.",
            offers: {
              "@type": "AggregateOffer",
              priceCurrency: "KRW",
              lowPrice: "9900",
              availability: "https://schema.org/InStock",
            },
          },
        ]}
      />
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
