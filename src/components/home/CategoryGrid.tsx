import { Link } from "react-router-dom";
import { categories } from "@/data/categories";

const CategoryGrid = () => {
  return (
    <section className="border-t border-b border-border bg-background">
      <div className="max-w-[1200px] mx-auto px-5 py-8">
        <div className="flex items-center justify-between gap-4 overflow-x-auto pb-1">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              to={`/category/${cat.id}`}
              className="group flex flex-col items-center gap-2.5 min-w-[90px] py-2"
            >
              <div
                className="w-[52px] h-[52px] rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 bg-secondary"
              >
                <cat.icon className="h-6 w-6" style={{ color: cat.color }} />
              </div>
              <span className="text-[13px] text-muted-foreground group-hover:text-foreground whitespace-nowrap transition-colors font-medium">
                {cat.name}
              </span>
            </Link>
          ))}

          {/* View all */}
          <Link
            to="/category/ai-image"
            className="group flex flex-col items-center gap-2.5 min-w-[90px] py-2"
          >
            <div className="w-[52px] h-[52px] rounded-2xl flex items-center justify-center bg-secondary transition-transform group-hover:scale-110">
              <svg className="h-6 w-6 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
                <rect x="14" y="14" width="7" height="7" rx="1" />
              </svg>
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
