import { useParams, Link } from "react-router-dom";
import { Star, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import SellerBadge from "@/components/SellerBadge";
import { useRef } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { useCategories, useServices } from "@/hooks/useSupabaseData";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getCategoryIcon, getAllCategoryIcon, shouldShowInHeroGrid } from "@/lib/categoryIcons";
import { useTranslation } from "react-i18next";
import { localize } from "@/utils/localize";

const formatPrice = (price: number) => price.toLocaleString("ko-KR");

const CategoryPage = () => {
  const { id } = useParams();
  const { data: categories = [] } = useCategories();
  const { data: allServices = [] } = useServices();
  const scrollRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();

  const isAll = id === "all";
  const category = categories.find((c) => c.id === id);
  const displayServices = isAll
    ? allServices
    : allServices.filter((s) => s.category_id === id);

  // Other category services (exclude current category)
  const otherServices = isAll
    ? []
    : allServices.filter((s) => s.category_id !== id);

  const scroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return;
    const amount = 300;
    scrollRef.current.scrollBy({ left: dir === "left" ? -amount : amount, behavior: "smooth" });
  };

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-foreground">{t("common.home")}</Link>
          <span>/</span>
           <span className="text-foreground">{isAll ? t("common.viewAll") : (category ? localize(category, "name") : "")}</span>
        </div>

        <h1 className="text-2xl font-bold text-foreground mb-2">
          {isAll ? t("category.allServices") : (category ? localize(category, "name") : "")}
        </h1>
        <p className="text-muted-foreground mb-8">
          {isAll ? t("category.allDesc") : category?.description}
        </p>

        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="w-full lg:w-60 shrink-0">
            <div className="space-y-6 p-4 border rounded-xl bg-card">
              <div>
                <h3 className="text-sm font-semibold mb-3">{t("common.category")}</h3>
                <div className="space-y-1.5 text-sm">
                  <Link to="/category/all" className={`flex items-center gap-2 py-1 hover:text-foreground ${isAll ? "text-primary font-medium" : "text-muted-foreground"}`}>
                    <img src={getAllCategoryIcon()} alt="" className="w-5 h-5 object-contain" />
                    {t("common.all")}
                  </Link>
                  {categories.filter((c) => shouldShowInHeroGrid(c.slug)).map((c) => (
                    <Link key={c.id} to={`/category/${c.id}`} className={`flex items-center gap-2 py-1 hover:text-foreground ${c.id === id ? "text-primary font-medium" : "text-muted-foreground"}`}>
                      <img src={getCategoryIcon(c.slug)} alt="" className="w-5 h-5 object-contain" />
                      {c.name}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          <div className="flex-1">
            <div className="flex items-center justify-between mb-6">
              <span className="text-sm text-muted-foreground">{t("category.servicesCount", { count: displayServices.length })}</span>
              <Button variant="outline" size="sm" className="gap-1">
                {t("category.recommended")} <ChevronDown className="h-3 w-3" />
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayServices.map((service) => (
                <Link key={service.id} to={`/service/${service.id}`}>
                  <Card className="overflow-hidden group hover:shadow-lg transition-all border-transparent hover:border-primary/20">
                    <div className="aspect-[4/3] overflow-hidden">
                      <img src={service.thumbnail || "/placeholder.svg"} alt={service.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                    </div>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-xs text-muted-foreground">{service.seller}</p>
                        <SellerBadge sellerId={(service as any).seller_id} sellerName={(service as any).seller_profiles?.business_name || service.seller} />
                      </div>
                      <h3 className="text-sm font-medium line-clamp-2 mb-2 min-h-[2.5rem]">{service.title}</h3>
                      <div className="flex items-center gap-1 mb-2">
                        <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm font-medium">{service.rating}</span>
                        <span className="text-xs text-muted-foreground">({service.review_count})</span>
                      </div>
                      <span className="text-lg font-bold">{formatPrice(service.price)}원</span>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Other services from different categories */}
        {!isAll && otherServices.length > 0 && (
          <div className="mt-16">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-primary">{t("category.otherServices")}</h2>
                <p className="text-sm text-muted-foreground mt-1">{t("category.otherServicesDesc")}</p>
              </div>
              {otherServices.length > 4 && (
                <div className="flex gap-2">
                  <Button variant="outline" size="icon" className="h-8 w-8 rounded-full" onClick={() => scroll("left")}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" className="h-8 w-8 rounded-full" onClick={() => scroll("right")}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
            <div
              ref={scrollRef}
              className="flex gap-5 overflow-x-auto scrollbar-hide pb-4"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {otherServices.map((service) => {
                const serviceCat = categories.find((c) => c.id === service.category_id);
                return (
                  <Link key={service.id} to={`/service/${service.id}`} className="group shrink-0 w-[calc(25%-15px)] min-w-[220px]">
                    <Card className="overflow-hidden hover:shadow-lg transition-all border-transparent hover:border-primary/20">
                      <div className="aspect-[4/3] overflow-hidden relative">
                        <img src={service.thumbnail || "/placeholder.svg"} alt={service.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                        {serviceCat && (
                          <span className="absolute top-2 left-2 px-2 py-0.5 text-[11px] font-medium rounded-full bg-background/80 backdrop-blur-sm text-foreground border">
                            {serviceCat.name}
                          </span>
                        )}
                      </div>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-xs text-muted-foreground">{service.seller}</p>
                          <SellerBadge sellerId={(service as any).seller_id} sellerName={service.seller} />
                        </div>
                        <h3 className="text-sm font-medium line-clamp-2 mb-2 min-h-[2.5rem]">{service.title}</h3>
                        <div className="flex items-center gap-1 mb-2">
                          <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm font-medium">{service.rating}</span>
                          <span className="text-xs text-muted-foreground">({service.review_count})</span>
                        </div>
                        <span className="text-lg font-bold">{formatPrice(service.price)}원</span>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default CategoryPage;
