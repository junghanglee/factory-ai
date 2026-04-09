import { Link } from "react-router-dom";
import { LayoutGrid } from "lucide-react";
import { useCategories } from "@/hooks/useSupabaseData";
import catAiImage from "@/assets/cat-ai-image.png";
import catAiVideo from "@/assets/cat-ai-video.png";
import catAiWebtoon from "@/assets/cat-ai-webtoon.png";
import catAiAds from "@/assets/cat-ai-ads.png";
import catAiAssistant from "@/assets/cat-ai-assistant.png";
import catAiGame from "@/assets/cat-ai-game.png";

const iconMap: Record<string, string> = {
  "ai-image": catAiImage,
  "ai-video": catAiVideo,
  "ai-webtoon": catAiWebtoon,
  "ai-ads": catAiAds,
  "ai-assistant": catAiAssistant,
  "ai-music": catAiGame,
};

const CategoryGrid = () => {
  const { data: categories = [] } = useCategories();

  return (
    <section className="border-t border-b border-border bg-background">
      <div className="max-w-[1200px] mx-auto px-5 py-8">
        <div className="flex items-center justify-between gap-4 overflow-x-auto pb-1">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              to={`/category/${cat.id}`}
              className="group flex flex-col items-center gap-2 min-w-[110px] py-2"
            >
              <div className="w-[80px] h-[80px] flex items-center justify-center transition-transform group-hover:scale-110">
                <img
                  src={iconMap[cat.slug] || catAiImage}
                  alt={cat.name}
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="text-[13px] text-muted-foreground group-hover:text-foreground whitespace-nowrap transition-colors font-medium">
                {cat.name}
              </span>
            </Link>
          ))}
          <Link
            to="/category/all"
            className="group flex flex-col items-center gap-2 min-w-[110px] py-2"
          >
            <div className="w-[80px] h-[80px] rounded-2xl flex items-center justify-center bg-secondary transition-transform group-hover:scale-110">
              <LayoutGrid className="h-8 w-8 text-muted-foreground" />
            </div>
            <span className="text-[13px] text-muted-foreground group-hover:text-foreground whitespace-nowrap transition-colors font-medium">
              전체보기
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default CategoryGrid;
