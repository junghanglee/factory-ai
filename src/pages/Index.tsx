import MainLayout from "@/components/layout/MainLayout";
import HeroSection from "@/components/home/HeroSection";
import CategoryGrid from "@/components/home/CategoryGrid";
import PopularServices from "@/components/home/PopularServices";
import USPBanner from "@/components/home/USPBanner";
import PortfolioGallery from "@/components/home/PortfolioGallery";

const Index = () => {
  return (
    <MainLayout>
      <HeroSection />
      <CategoryGrid />
      <PopularServices />
      <USPBanner />
      <PortfolioGallery />
    </MainLayout>
  );
};

export default Index;
