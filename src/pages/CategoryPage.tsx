import { useParams, Link } from "react-router-dom";
import { Star, ChevronDown } from "lucide-react";
import MainLayout from "@/components/layout/MainLayout";
import { useCategories, useServices } from "@/hooks/useSupabaseData";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const formatPrice = (price: number) => price.toLocaleString("ko-KR");

const CategoryPage = () => {
  const { id } = useParams();
  const { data: categories = [] } = useCategories();
  const { data: allServices = [] } = useServices();

  const isAll = id === "all";
  const category = categories.find((c) => c.id === id);
  const displayServices = isAll
    ? allServices
    : allServices.filter((s) => s.category_id === id);

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-foreground">홈</Link>
          <span>/</span>
          <span className="text-foreground">{isAll ? "전체보기" : category?.name}</span>
        </div>

        <h1 className="text-2xl font-bold text-foreground mb-2">
          {isAll ? "전체 서비스" : category?.name}
        </h1>
        <p className="text-muted-foreground mb-8">
          {isAll ? "모든 AI 콘텐츠 서비스를 둘러보세요" : category?.description}
        </p>

        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="w-full lg:w-60 shrink-0">
            <div className="space-y-6 p-4 border rounded-xl bg-card">
              <div>
                <h3 className="text-sm font-semibold mb-3">카테고리</h3>
                <div className="space-y-2 text-sm">
                  <Link to="/category/all" className={`block hover:text-foreground ${isAll ? "text-primary font-medium" : "text-muted-foreground"}`}>
                    전체
                  </Link>
                  {categories.map((c) => (
                    <Link key={c.id} to={`/category/${c.id}`} className={`block hover:text-foreground ${c.id === id ? "text-primary font-medium" : "text-muted-foreground"}`}>
                      {c.name}
                    </Link>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-sm font-semibold mb-3">가격대</h3>
                <div className="space-y-2 text-sm">
                  {["전체", "~3만원", "3~5만원", "5~10만원", "10만원~"].map((v) => (
                    <label key={v} className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="price" className="accent-primary" defaultChecked={v === "전체"} />
                      {v}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          <div className="flex-1">
            <div className="flex items-center justify-between mb-6">
              <span className="text-sm text-muted-foreground">{displayServices.length}개 서비스</span>
              <Button variant="outline" size="sm" className="gap-1">
                추천순 <ChevronDown className="h-3 w-3" />
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
                      <p className="text-xs text-muted-foreground mb-1">{service.seller}</p>
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
      </div>
    </MainLayout>
  );
};

export default CategoryPage;
