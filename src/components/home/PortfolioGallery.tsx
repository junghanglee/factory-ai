import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";
import { localize } from "@/utils/localize";

const PortfolioGallery = () => {
  const { t } = useTranslation();
  const { data: items = [] } = useQuery({
    queryKey: ["portfolio_public"],
    queryFn: async () => {
      const { data, error } = await supabase.from("portfolio_items").select("*").eq("active", true).order("sort_order");
      if (error) throw error;
      return data ?? [];
    },
  });

  if (items.length === 0) return null;

  return (
    <section className="py-14">
      <div className="max-w-[1200px] mx-auto px-5">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-[24px] font-bold text-foreground">{t("portfolio.title")}</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {items.map((item) => {
            const thumb = item.image_url || (item.files as string[] | null)?.[0] || "";
            return (
              <Link to={`/portfolio/${item.id}`} key={item.id} className="aspect-[4/3] rounded-xl overflow-hidden group cursor-pointer relative bg-secondary block">
                {thumb ? (
                  <img src={thumb} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">No Image</div>
                )}
                <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/50 transition-colors flex flex-col items-center justify-center">
                  <span className="text-background text-[14px] font-medium opacity-0 group-hover:opacity-100 transition-opacity">{localize(item, "title")}</span>
                  {item.category && (
                    <span className="text-background/70 text-[12px] opacity-0 group-hover:opacity-100 transition-opacity mt-1">{item.category}</span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default PortfolioGallery;
