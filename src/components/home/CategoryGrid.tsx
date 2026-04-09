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
              className="group flex flex-col items-center gap-2.5 min-w-[100px] py-2"
            >
              <div className="w-[64px] h-[64px] flex items-center justify-center transition-transform group-hover:scale-110">
                <img
                  src={cat.image}
                  alt={cat.name}
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="text-[13px] text-muted-foreground group-hover:text-foreground whitespace-nowrap transition-colors font-medium">
                {cat.name}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CategoryGrid;
