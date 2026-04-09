import { Link } from "react-router-dom";
import { categories } from "@/data/categories";

const CategoryGrid = () => {
  return (
    <section className="py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold text-foreground mb-8 text-center">
          서비스 카테고리
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              to={`/category/${cat.id}`}
              className="group flex flex-col items-center gap-3 p-6 rounded-xl border bg-card hover:shadow-lg hover:border-primary/30 transition-all duration-200"
            >
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110"
                style={{ backgroundColor: `${cat.color}15` }}
              >
                <cat.icon className="h-7 w-7" style={{ color: cat.color }} />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-foreground leading-tight">{cat.name}</p>
                <p className="text-xs text-muted-foreground mt-1">{cat.serviceCount}개 서비스</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CategoryGrid;
