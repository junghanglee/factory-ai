import { useParams, Link } from "react-router-dom";
import { Star, Filter, ChevronDown } from "lucide-react";
import MainLayout from "@/components/layout/MainLayout";
import { categories } from "@/data/categories";
import { services } from "@/data/services";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const formatPrice = (price: number) => price.toLocaleString("ko-KR");

const CategoryPage = () => {
  const { id } = useParams();
  const category = categories.find((c) => c.id === id) || categories[0];
  const categoryServices = id ? services.filter((s) => s.categoryId === id) : services;
  // Show all services if no match for demo purposes
  const displayServices = categoryServices.length > 0 ? categoryServices : services;

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-foreground">홈</Link>
          <span>/</span>
          <span className="text-foreground">{category.name}</span>
        </div>

        <h1 className="text-2xl font-bold text-foreground mb-2">{category.name}</h1>
        <p className="text-muted-foreground mb-8">{category.description}</p>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar filters */}
          <aside className="w-full lg:w-60 shrink-0">
            <div className="space-y-6 p-4 border rounded-xl bg-card">
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
              <div>
                <h3 className="text-sm font-semibold mb-3">납기</h3>
                <div className="space-y-2 text-sm">
                  {["전체", "1일 이내", "3일 이내", "7일 이내"].map((v) => (
                    <label key={v} className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="delivery" className="accent-primary" defaultChecked={v === "전체"} />
                      {v}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          {/* Service grid */}
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
                      <img src={service.thumbnail} alt={service.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                    </div>
                    <CardContent className="p-4">
                      <p className="text-xs text-muted-foreground mb-1">{service.seller}</p>
                      <h3 className="text-sm font-medium line-clamp-2 mb-2 min-h-[2.5rem]">{service.title}</h3>
                      <div className="flex items-center gap-1 mb-2">
                        <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm font-medium">{service.rating}</span>
                        <span className="text-xs text-muted-foreground">({service.reviewCount})</span>
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
