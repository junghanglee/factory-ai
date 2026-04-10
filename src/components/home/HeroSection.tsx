import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { popularKeywords } from "@/data/services";
import { supabase } from "@/integrations/supabase/client";

interface BannerData {
  id: string;
  title: string;
  subtitle: string | null;
  image_url: string | null;
  link_url: string | null;
  active: boolean;
  sort_order: number;
}

const fallbackBanners = [
  { title: "에이전시 반값!", subtitle: "AI 콘텐츠 제작\n지금 바로 시작하세요", link_url: "/category/ai-image", image_url: null },
  { title: "대량생산 가능", subtitle: "수백 개의 콘텐츠도\n균일한 퀄리티로", link_url: "/chat", image_url: null },
  { title: "빠른 납기", subtitle: "AI 자동화로\n3~5배 빠르게 납품", link_url: "/category/ai-video", image_url: null },
];

const HeroSection = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentBanner, setCurrentBanner] = useState(0);
  const [banners, setBanners] = useState<BannerData[]>([]);

  useEffect(() => {
    let cancelled = false;
    const fetchBanners = async (retries = 3) => {
      for (let i = 0; i < retries; i++) {
        const { data, error } = await supabase
          .from("banners")
          .select("*")
          .eq("active", true)
          .order("sort_order", { ascending: true });

        if (!cancelled && !error && data && data.length > 0) {
          setBanners(data);
          return;
        }
        if (i < retries - 1) await new Promise(r => setTimeout(r, 1000 * (i + 1)));
      }
    };
    fetchBanners();
    return () => { cancelled = true; };
  }, []);

  const displayBanners = banners.length > 0 ? banners : fallbackBanners;
  const safeIndex = currentBanner % displayBanners.length;
  const current = displayBanners[safeIndex];

  const nextBanner = () => setCurrentBanner((prev) => (prev + 1) % displayBanners.length);
  const prevBanner = () => setCurrentBanner((prev) => (prev - 1 + displayBanners.length) % displayBanners.length);

  // Auto-rotate every 5 seconds
  useEffect(() => {
    if (displayBanners.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % displayBanners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [displayBanners.length]);

  const hasBannerImage = current.image_url && !current.image_url.endsWith(".mp4");

  return (
    <section className="relative overflow-hidden">
      {/* Video Background */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
      >
        <source src="/videos/hero-bg.mp4" type="video/mp4" />
      </video>
      <div className="absolute inset-0 bg-black/60" />

      <div className="relative z-10 max-w-[1200px] mx-auto px-5 py-12 md:py-16">
        <div className="flex flex-col md:flex-row items-start gap-10 md:gap-16">
          {/* Left side - text + search */}
          <div className="flex-1 pt-2">
            <h1 className="text-[32px] md:text-[40px] font-bold text-white leading-[1.3] mb-8 tracking-tight">
              AI 콘텐츠가 필요한 순간,
              <br />
              <span className="text-primary">딱 맞는 서비스</span>를 찾아보세요
            </h1>

            {/* Search */}
            <div className="relative max-w-[520px] mb-5">
              <input
                type="text"
                placeholder="어떤 전문가가 필요하세요?"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-[52px] pl-6 pr-16 rounded-full border-2 border-white/30 bg-white/10 backdrop-blur-sm text-white text-[16px] placeholder:text-white/60 focus:outline-none focus:border-white/60 transition-colors shadow-sm"
              />
              <button className="absolute right-2 top-2 h-9 w-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/80 transition-colors">
                <Search className="h-5 w-5" />
              </button>
            </div>

            {/* Popular keywords */}
            <div className="flex flex-wrap items-center gap-2">
              {popularKeywords.slice(0, 8).map((keyword) => (
                <Link
                  key={keyword}
                  to={`/category/ai-image`}
                  className="px-3.5 py-1.5 text-[13px] rounded-full border border-white/30 text-white/80 hover:border-white hover:text-white transition-colors bg-white/10 backdrop-blur-sm"
                >
                  {keyword}
                </Link>
              ))}
            </div>
          </div>

          {/* Right side - promotional banner carousel */}
          <div className="w-full md:w-[380px] shrink-0">
            <div className="relative rounded-2xl overflow-hidden aspect-[380/260]">
              {/* Banner image background */}
              {hasBannerImage && (
                <img
                  src={current.image_url!}
                  alt={current.title}
                  className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500"
                />
              )}
              <div
                className={`absolute inset-0 ${hasBannerImage ? "bg-black/40" : "bg-white/10 backdrop-blur-md"} p-7 flex flex-col justify-between transition-colors duration-300 border border-white/20`}
              >
                <div>
                  <span className="inline-block px-3 py-1 rounded-full bg-primary/80 text-white text-[12px] font-medium mb-3">
                    AI팩토리
                  </span>
                  <h3 className="text-[22px] font-bold text-white leading-snug mb-1">
                    {current.title}
                  </h3>
                  <p className="text-[14px] text-white/80 whitespace-pre-line leading-relaxed">
                    {current.subtitle}
                  </p>
                </div>
                <div className="flex items-center justify-between">
                  <Link
                    to={current.link_url || "/"}
                    className="text-[13px] text-white/90 hover:text-white underline underline-offset-2"
                  >
                    자세히 보기 →
                  </Link>
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] text-white/70">
                      {(currentBanner % displayBanners.length) + 1} / {displayBanners.length}
                    </span>
                    <div className="flex gap-1">
                      <button
                        onClick={prevBanner}
                        className="w-6 h-6 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white"
                      >
                        <ChevronLeft className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={nextBanner}
                        className="w-6 h-6 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white"
                      >
                        <ChevronRight className="h-3.5 w-3.5" />
                      </button>
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
