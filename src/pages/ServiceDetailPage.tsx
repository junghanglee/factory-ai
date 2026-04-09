import { useParams, Link } from "react-router-dom";
import { Star, Clock, MessageCircle, ShoppingCart, ChevronRight } from "lucide-react";
import MainLayout from "@/components/layout/MainLayout";
import { services } from "@/data/services";
import { categories } from "@/data/categories";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const formatPrice = (price: number) => price.toLocaleString("ko-KR");

const packages = [
  { name: "Basic", multiplier: 1, deliveryDays: 3, revisions: 1, features: ["기본 콘텐츠 1종", "1회 수정", "소스파일 미제공"] },
  { name: "Standard", multiplier: 1.8, deliveryDays: 5, revisions: 3, features: ["콘텐츠 3종", "3회 수정", "소스파일 제공", "빠른 납기 옵션"] },
  { name: "Premium", multiplier: 3, deliveryDays: 7, revisions: 5, features: ["콘텐츠 5종", "무제한 수정", "소스파일 제공", "빠른 납기", "전담 매니저"] },
];

const reviews = [
  { user: "김**", rating: 5, date: "2026.03.15", content: "퀄리티가 정말 좋습니다. 에이전시보다 훨씬 저렴하고 빠르게 받았어요!" },
  { user: "이**", rating: 5, date: "2026.03.10", content: "대량 주문했는데 퀄리티가 균일하게 잘 나왔습니다. 추천합니다." },
  { user: "박**", rating: 4, date: "2026.03.05", content: "전반적으로 만족합니다. 수정 요청도 빠르게 반영해주셨어요." },
];

const ServiceDetailPage = () => {
  const { id } = useParams();
  const service = services.find((s) => s.id === id) || services[0];
  const category = categories.find((c) => c.id === service.categoryId);

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-foreground">홈</Link>
          <ChevronRight className="h-3 w-3" />
          <Link to={`/category/${category?.id}`} className="hover:text-foreground">{category?.name}</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground truncate max-w-[200px]">{service.title}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left - Service info */}
          <div className="lg:col-span-2 space-y-8">
            {/* Image */}
            <div className="aspect-video rounded-xl overflow-hidden border">
              <img src={service.thumbnail} alt={service.title} className="w-full h-full object-cover" />
            </div>

            {/* Title & meta */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-accent text-accent-foreground">{category?.name}</span>
              </div>
              <h1 className="text-2xl font-bold text-foreground mb-3">{service.title}</h1>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{service.seller}</span>
                <span className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  {service.rating} ({service.reviewCount}개 리뷰)
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {service.deliveryDays}일 이내 납품
                </span>
              </div>
            </div>

            {/* Description */}
            <div>
              <h2 className="text-lg font-semibold mb-3">서비스 설명</h2>
              <p className="text-muted-foreground leading-relaxed">{service.description}</p>
              <div className="mt-4 p-4 rounded-lg bg-accent/50">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  AI팩토리의 전문 크리에이터가 최신 AI 기술을 활용하여 제작합니다. 
                  기존 에이전시 대비 50% 이상 저렴하면서도 높은 퀄리티를 보장합니다.
                  대량 주문 시 추가 할인이 적용됩니다.
                </p>
              </div>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2">
              {service.tags.map((tag) => (
                <span key={tag} className="px-3 py-1 text-sm rounded-full border text-muted-foreground">
                  #{tag}
                </span>
              ))}
            </div>

            {/* Reviews */}
            <div>
              <h2 className="text-lg font-semibold mb-4">리뷰 ({service.reviewCount})</h2>
              <div className="space-y-4">
                {reviews.map((review, idx) => (
                  <div key={idx} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{review.user}</span>
                        <div className="flex">
                          {Array.from({ length: review.rating }).map((_, i) => (
                            <Star key={i} className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                          ))}
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground">{review.date}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{review.content}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right - Pricing sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <Card>
                <CardContent className="p-0">
                  <Tabs defaultValue="Standard">
                    <TabsList className="w-full rounded-none border-b">
                      {packages.map((pkg) => (
                        <TabsTrigger key={pkg.name} value={pkg.name} className="flex-1 text-sm">
                          {pkg.name}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                    {packages.map((pkg) => (
                      <TabsContent key={pkg.name} value={pkg.name} className="p-5 space-y-4">
                        <div>
                          <span className="text-3xl font-bold text-foreground">
                            {formatPrice(Math.round(service.price * pkg.multiplier))}원
                          </span>
                        </div>
                        <div className="text-sm text-muted-foreground space-y-1">
                          <p>납기: {pkg.deliveryDays}일</p>
                          <p>수정: {pkg.revisions === 5 ? "무제한" : `${pkg.revisions}회`}</p>
                        </div>
                        <ul className="space-y-2">
                          {pkg.features.map((f) => (
                            <li key={f} className="text-sm flex items-start gap-2">
                              <span className="text-primary mt-0.5">✓</span>
                              {f}
                            </li>
                          ))}
                        </ul>
                        <div className="space-y-2 pt-2">
                          <Link to="/order" className="block">
                            <Button className="w-full gap-2">
                              <ShoppingCart className="h-4 w-4" />
                              주문하기
                            </Button>
                          </Link>
                          <Link to="/chat" className="block">
                            <Button variant="outline" className="w-full gap-2">
                              <MessageCircle className="h-4 w-4" />
                              문의하기
                            </Button>
                          </Link>
                        </div>
                      </TabsContent>
                    ))}
                  </Tabs>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default ServiceDetailPage;
