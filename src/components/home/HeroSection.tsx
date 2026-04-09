import { useState } from "react";
import { Search } from "lucide-react";
import { popularKeywords } from "@/data/services";

const HeroSection = () => {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <section className="relative overflow-hidden" style={{ background: "var(--gradient-hero)" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-3xl md:text-5xl font-bold text-foreground leading-tight mb-4">
            AI로 만드는 콘텐츠,
            <br />
            <span className="text-primary">에이전시 반값</span>에
          </h1>
          <p className="text-lg text-muted-foreground mb-8">
            높은 퀄리티 · 빠른 납기 · 대량생산 가능
          </p>

          {/* Search */}
          <div className="relative max-w-xl mx-auto mb-6">
            <input
              type="text"
              placeholder="어떤 AI 콘텐츠가 필요하세요?"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-14 pl-6 pr-16 rounded-full border-2 border-primary/20 bg-background text-base focus:outline-none focus:border-primary shadow-lg"
            />
            <button className="absolute right-2 top-2 h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors">
              <Search className="h-5 w-5" />
            </button>
          </div>

          {/* Popular keywords */}
          <div className="flex flex-wrap justify-center gap-2">
            <span className="text-sm text-muted-foreground">인기:</span>
            {popularKeywords.slice(0, 6).map((keyword) => (
              <button
                key={keyword}
                className="px-3 py-1 text-sm rounded-full bg-background border hover:border-primary hover:text-primary transition-colors"
              >
                {keyword}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Decorative elements */}
      <div className="absolute top-10 left-10 w-20 h-20 rounded-full bg-primary/5 blur-xl" />
      <div className="absolute bottom-10 right-10 w-32 h-32 rounded-full bg-primary/5 blur-xl" />
    </section>
  );
};

export default HeroSection;
