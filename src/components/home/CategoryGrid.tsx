import { Link } from "react-router-dom";
import { useCategories } from "@/hooks/useSupabaseData";
import { getCategoryIcon, getAllCategoryIcon, shouldShowInHeroGrid } from "@/lib/categoryIcons";

const CategoryGrid = () => {
  const { data: categories = [] } = useCategories();
  const visibleCategories = categories.filter((c) => shouldShowInHeroGrid(c.slug));

  return (
    <section className="border-t border-b border-border bg-background">
      <div className="max-w-[1200px] mx-auto px-5 py-8">
        <div className="flex items-center justify-between gap-4 overflow-x-auto pb-1">
          {visibleCategories.map((cat) => (
            <Link
              key={cat.id}
              to={`/category/${cat.id}`}
              className="group flex flex-col items-center gap-2 min-w-[100px] py-2"
            >
              <div className="w-[72px] h-[72px] flex items-center justify-center transition-transform group-hover:scale-110">
                <img
                  src={getCategoryIcon(cat.slug)}
                  alt={cat.name}
                  className="w-full h-full object-contain"
                  loading="lazy"
                  width={72}
                  height={72}
                />
              </div>
              <span className="text-[13px] text-muted-foreground group-hover:text-foreground whitespace-nowrap transition-colors font-medium">
                {cat.name}
              </span>
            </Link>
          ))}
          <Link
            to="/category/all"
            className="group flex flex-col items-center gap-2 min-w-[100px] py-2"
          >
            <div className="w-[72px] h-[72px] flex items-center justify-center transition-transform group-hover:scale-110">
              <img
                src={getAllCategoryIcon()}
                alt="전체보기"
                className="w-full h-full object-contain"
                loading="lazy"
                width={72}
                height={72}
              />
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
