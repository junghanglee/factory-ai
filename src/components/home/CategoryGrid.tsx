import { Link } from "react-router-dom";
import { useCategories } from "@/hooks/useSupabaseData";
import { getCategoryIcon, getAllCategoryIcon, shouldShowInHeroGrid } from "@/lib/categoryIcons";
import { useTranslation } from "react-i18next";
import { localize } from "@/utils/localize";

const CategoryGrid = () => {
  const { t } = useTranslation();
  const { data: categories = [] } = useCategories();
  const visibleCategories = categories.filter((c) => shouldShowInHeroGrid(c.slug));

  return (
    <section className="border-t border-b border-border bg-background">
      <div className="max-w-[1200px] mx-auto px-5 py-8">
        <div className="flex items-start justify-between gap-2 sm:gap-3 overflow-x-auto pb-1">
          {visibleCategories.map((cat) => (
            <Link key={cat.id} to={`/category/${cat.id}`} className="group flex flex-col items-center gap-2 w-[120px] shrink-0 py-2">
              <div className="w-[72px] h-[72px] flex items-center justify-center transition-transform group-hover:scale-110">
                <img src={getCategoryIcon(cat.slug)} alt={localize(cat, "name")} className="w-full h-full object-contain" loading="lazy" width={72} height={72} />
              </div>
              <span className="text-[12px] leading-tight text-center text-muted-foreground group-hover:text-foreground transition-colors font-medium break-words">{localize(cat, "name")}</span>
            </Link>
          ))}
          <Link to="/category/all" className="group flex flex-col items-center gap-2 w-[120px] shrink-0 py-2">
            <div className="w-[72px] h-[72px] flex items-center justify-center transition-transform group-hover:scale-110">
              <img src={getAllCategoryIcon()} alt={t("common.viewAll")} className="w-full h-full object-contain" loading="lazy" width={72} height={72} />
            </div>
            <span className="text-[12px] leading-tight text-center text-muted-foreground group-hover:text-foreground transition-colors font-medium break-words">{t("common.viewAll")}</span>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default CategoryGrid;
