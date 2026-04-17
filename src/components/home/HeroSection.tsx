import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { popularKeywords } from "@/data/services";
import { useBanners } from "@/hooks/useSupabaseData";
import { useTranslation } from "react-i18next";

const HeroSection = () => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentBanner, setCurrentBanner] = useState(0);
  const { data: banners } = useBanners();
  const navigate = useNavigate();

  const fallbackBanners = [
    { title: t("hero.fallback1Title"), subtitle: t("hero.fallback1Sub"), link_url: "/category/ai-image", image_url: null },
    { title: t("hero.fallback2Title"), subtitle: t("hero.fallback2Sub"), link_url: "/chat", image_url: null },
    { title: t("hero.fallback3Title"), subtitle: t("hero.fallback3Sub"), link_url: "/category/ai-video", image_url: null },
  ];

  const displayBanners = banners && banners.length > 0 ? banners : fallbackBanners;
  const safeIndex = currentBanner % displayBanners.length;
  const current = displayBanners[safeIndex];

  const nextBanner = () => setCurrentBanner((prev) => (prev + 1) % displayBanners.length);
  const prevBanner = () => setCurrentBanner((prev) => (prev - 1 + displayBanners.length) % displayBanners.length);

  useEffect(() => {
    if (displayBanners.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % displayBanners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [displayBanners.length]);

  const hasBannerImage = current.image_url && !current.image_url.endsWith(".mp4");

  // Preload the first banner image for faster LCP
  const firstBannerImage = displayBanners[0]?.image_url;
  useEffect(() => {
    if (!firstBannerImage || firstBannerImage.endsWith(".mp4")) return;
    const link = document.createElement("link");
    link.rel = "preload";
    link.as = "image";
    link.href = firstBannerImage;
    link.fetchPriority = "high";
    document.head.appendChild(link);
    return () => {
      document.head.removeChild(link);
    };
  }, [firstBannerImage]);

  const handleSearch = () => {
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  };

  return (
    <section className="relative overflow-hidden bg-black">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover" src="/hero-bg.mp4" />
      </div>

      <div className="relative z-10 max-w-[1200px] mx-auto px-5 py-12 md:py-16">
        <div className="flex flex-col md:flex-row items-stretch gap-10 md:gap-16">
          <div className="flex-1 flex flex-col justify-between">
            <div>
              <h1 className="text-[32px] md:text-[40px] font-bold text-white leading-[1.3] mb-8 tracking-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.7)]">
                {t("hero.title1")}
                <br />
                <span className="text-primary drop-shadow-[0_2px_6px_rgba(0,0,0,0.5)]">{t("hero.title2")}</span>{t("hero.title3")}
              </h1>

              <div className="relative max-w-[520px] mb-5">
                <input
                  type="text"
                  placeholder={t("hero.searchPlaceholder")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  className="w-full h-[52px] pl-6 pr-16 rounded-full border-2 border-white/30 bg-black/40 backdrop-blur-sm text-white text-[16px] placeholder:text-white/60 focus:outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition-colors shadow-lg"
                />
                <button onClick={handleSearch} className="absolute right-2 top-2 h-9 w-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/80 transition-colors">
                  <Search className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {popularKeywords.slice(0, 8).map((keyword) => (
                <Link key={keyword} to={`/search?q=${encodeURIComponent(keyword)}`} className="px-3.5 py-1.5 text-[13px] rounded-full border border-white/30 text-white/80 hover:border-primary hover:text-primary transition-colors bg-black/30 backdrop-blur-sm">
                  {keyword}
                </Link>
              ))}
            </div>
          </div>

          <div className="w-full md:w-[400px] shrink-0 flex items-stretch">
            <div className="relative rounded-2xl overflow-hidden w-full shadow-lg min-h-[280px]">
              {hasBannerImage && (
                <img
                  src={current.image_url!}
                  alt={current.title}
                  className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500"
                  fetchPriority={safeIndex === 0 ? "high" : "auto"}
                  loading={safeIndex === 0 ? "eager" : "lazy"}
                  decoding="async"
                />
              )}
              <div className={`relative z-10 w-full h-full ${hasBannerImage ? "bg-black/40" : "bg-primary/90"} p-7 flex flex-col justify-between transition-colors duration-300`}>
                <div>
                  <span className="inline-block px-3 py-1 rounded-full bg-white/20 text-white text-[12px] font-medium mb-3">{t("hero.aifactory")}</span>
                  <h3 className="text-[22px] font-bold text-white leading-snug mb-1">{current.title}</h3>
                  <p className="text-[14px] text-white/80 whitespace-pre-line leading-relaxed">{current.subtitle}</p>
                </div>
                <div className="flex items-center justify-between">
                  <Link to={current.link_url || "/"} className="text-[13px] text-white/90 hover:text-white underline underline-offset-2">{t("hero.learnMore")}</Link>
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] text-white/70">{safeIndex + 1} / {displayBanners.length}</span>
                    <div className="flex gap-1">
                      <button onClick={prevBanner} className="w-6 h-6 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white"><ChevronLeft className="h-3.5 w-3.5" /></button>
                      <button onClick={nextBanner} className="w-6 h-6 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white"><ChevronRight className="h-3.5 w-3.5" /></button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
