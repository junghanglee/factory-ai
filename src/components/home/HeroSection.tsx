import { useState } from "react";
import { Link } from "react-router-dom";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { popularKeywords } from "@/data/services";

const banners = [
  {
    title: "에이전시 반값!",
    subtitle: "AI 콘텐츠 제작\n지금 바로 시작하세요",
    cta: "서비스 둘러보기",
    bgColor: "bg-primary",
    link: "/category/ai-image",
  },
  {
    title: "대량생산 가능",
    subtitle: "수백 개의 콘텐츠도\n균일한 퀄리티로",
    cta: "대량 주문 문의",
    bgColor: "bg-foreground",
    link: "/chat",
  },
  {
    title: "빠른 납기",
    subtitle: "AI 자동화로\n3~5배 빠르게 납품",
    cta: "자세히 보기",
    bgColor: "bg-primary",
    link: "/category/ai-video",
  },
];

const HeroSection = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentBanner, setCurrentBanner] = useState(0);

  const nextBanner = () => setCurrentBanner((prev) => (prev + 1) % banners.length);
  const prevBanner = () => setCurrentBanner((prev) => (prev - 1 + banners.length) % banners.length);

  return (
    <section className="bg-background">
      <div className="max-w-[1200px] mx-auto px-5 py-12 md:py-16">
        <div className="flex flex-col md:flex-row items-start gap-10 md:gap-16">
          {/* Left side - text + search */}
          <div className="flex-1 pt-2">
            <h1 className="text-[32px] md:text-[40px] font-bold text-foreground leading-[1.3] mb-8 tracking-tight">
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
                className="w-full h-[52px] pl-6 pr-16 rounded-full border-2 border-border bg-background text-[16px] focus:outline-none focus:border-foreground transition-colors shadow-sm"
              />
              <button className="absolute right-2 top-2 h-9 w-9 rounded-full bg-foreground text-background flex items-center justify-center hover:bg-foreground/80 transition-colors">
                <Search className="h-5 w-5" />
              </button>
            </div>

            {/* Popular keywords */}
            <div className="flex flex-wrap items-center gap-2">
              {popularKeywords.slice(0, 8).map((keyword) => (
                <Link
                  key={keyword}
                  to={`/category/ai-image`}
                  className="px-3.5 py-1.5 text-[13px] rounded-full border border-border text-muted-foreground hover:border-foreground hover:text-foreground transition-colors bg-background"
                >
                  {keyword}
                </Link>
              ))}
            </div>
          </div>

          {/* Right side - promotional banner carousel */}
          <div className="w-full md:w-[380px] shrink-0">
            <div className="relative rounded-2xl overflow-hidden aspect-[380/260]">
              <div
                className={`absolute inset-0 ${banners[currentBanner].bgColor} p-7 flex flex-col justify-between transition-colors duration-300`}
              >
                <div>
                  <span className="inline-block px-3 py-1 rounded-full bg-background/20 text-background text-[12px] font-medium mb-3">
                    AI팩토리
                  </span>
                  <h3 className="text-[22px] font-bold text-background leading-snug mb-1">
                    {banners[currentBanner].title}
                  </h3>
                  <p className="text-[14px] text-background/80 whitespace-pre-line leading-relaxed">
                    {banners[currentBanner].subtitle}
                  </p>
                </div>
                <div className="flex items-center justify-between">
                  <Link
                    to={banners[currentBanner].link}
                    className="text-[13px] text-background/90 hover:text-background underline underline-offset-2"
                  >
                    {banners[currentBanner].cta} →
                  </Link>
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] text-background/70">
                      {currentBanner + 1} / {banners.length}
                    </span>
                    <div className="flex gap-1">
                      <button
                        onClick={prevBanner}
                        className="w-6 h-6 rounded-full bg-background/20 hover:bg-background/30 flex items-center justify-center text-background"
                      >
                        <ChevronLeft className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={nextBanner}
                        className="w-6 h-6 rounded-full bg-background/20 hover:bg-background/30 flex items-center justify-center text-background"
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
