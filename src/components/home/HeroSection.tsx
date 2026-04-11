import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { popularKeywords } from "@/data/services";
import { useBanners } from "@/hooks/useSupabaseData";

const fallbackBanners = [
  { title: "에이전시 반값!", subtitle: "AI 콘텐츠 제작\n지금 바로 시작하세요", link_url: "/category/ai-image", image_url: null },
  { title: "대량생산 가능", subtitle: "수백 개의 콘텐츠도\n균일한 퀄리티로", link_url: "/chat", image_url: null },
  { title: "빠른 납기", subtitle: "AI 자동화로\n3~5배 빠르게 납품", link_url: "/category/ai-video", image_url: null },
];

const HeroSection = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentBanner, setCurrentBanner] = useState(0);
  const { data: banners } = useBanners();
  const navigate = useNavigate();

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

  const handleSearch = () => {
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  };

  return (
    <section className="relative overflow-hidden bg-background">
      {/* Decorative patterns */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Top-right circles */}
        <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-primary/5" />
        <div className="absolute -top-10 -right-10 w-60 h-60 rounded-full bg-primary/3" />
        {/* Bottom-left circles */}
        <div className="absolute -bottom-16 -left-16 w-64 h-64 rounded-full bg-accent/30" />
        {/* Dot grid pattern */}
        <svg className="absolute top-8 left-1/3 opacity-[0.06]" width="120" height="120">
          {Array.from({ length: 36 }).map((_, i) => (
            <circle key={i} cx={(i % 6) * 20 + 10} cy={Math.floor(i / 6) * 20 + 10} r="2" fill="currentColor" className="text-foreground" />
          ))}
        </svg>
        {/* Diagonal lines */}
        <svg className="absolute bottom-4 right-1/4 opacity-[0.04]" width="100" height="100">
          <line x1="0" y1="100" x2="100" y2="0" stroke="currentColor" strokeWidth="1" className="text-primary" />
          <line x1="20" y1="100" x2="100" y2="20" stroke="currentColor" strokeWidth="1" className="text-primary" />
          <line x1="40" y1="100" x2="100" y2="40" stroke="currentColor" strokeWidth="1" className="text-primary" />
        </svg>
      </div>

      <div className="relative z-10 max-w-[1200px] mx-auto px-5 py-12 md:py-16">
        <div className="flex flex-col md:flex-row items-stretch gap-10 md:gap-16">
          {/* Left side - text + search */}
          <div className="flex-1 flex flex-col justify-between">
            <div>
              <h1 className="text-[32px] md:text-[40px] font-bold text-foreground leading-[1.3] mb-8 tracking-tight">
                최고의 AI콘텐츠 전문가와,
                <br />
                대량생산 자동화공정을 통해
                <br />
                <span className="text-primary">압도적인 품질과 가격</span>으로 제작
              </h1>

              {/* Search */}
              <div className="relative max-w-[520px] mb-5">
                <input
                  type="text"
                  placeholder="어떤 서비스가 필요하세요?"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  className="w-full h-[52px] pl-6 pr-16 rounded-full border-2 border-border bg-secondary/50 text-foreground text-[16px] placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition-colors shadow-sm"
                />
                <button
                  onClick={handleSearch}
                  className="absolute right-2 top-2 h-9 w-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/80 transition-colors"
                >
                  <Search className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Popular keywords */}
            <div className="flex flex-wrap items-center gap-2">
              {popularKeywords.slice(0, 8).map((keyword) => (
                <Link
                  key={keyword}
                  to={`/search?q=${encodeURIComponent(keyword)}`}
                  className="px-3.5 py-1.5 text-[13px] rounded-full border border-border text-muted-foreground hover:border-primary hover:text-primary transition-colors bg-secondary/50"
                >
                  {keyword}
                </Link>
              ))}
            </div>
          </div>

          {/* Right side - promotional banner carousel */}
          <div className="w-full md:w-[400px] shrink-0 flex items-stretch">
            <div className="relative rounded-2xl overflow-hidden w-full shadow-lg">
              {hasBannerImage && (
                <img
                  src={current.image_url!}
                  alt={current.title}
                  className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500"
                />
              )}
              <div
                className={`w-full h-full ${hasBannerImage ? "bg-black/40" : "bg-primary/90"} p-7 flex flex-col justify-between transition-colors duration-300`}
              >
                <div>
                  <span className="inline-block px-3 py-1 rounded-full bg-white/20 text-white text-[12px] font-medium mb-3">
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
                      {safeIndex + 1} / {displayBanners.length}
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
