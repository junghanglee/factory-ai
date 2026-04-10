import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Star, Clock, MessageCircle, ShoppingCart, ChevronRight } from "lucide-react";
import MainLayout from "@/components/layout/MainLayout";
import { useService, useServicePackages, useCategories } from "@/hooks/useSupabaseData";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import OrderRequestDialog, { OrderFormData } from "@/components/chat/OrderRequestDialog";

const formatPrice = (price: number) => price.toLocaleString("ko-KR");

const reviews = [
  { user: "김**", rating: 5, date: "2026.03.15", content: "퀄리티가 정말 좋습니다. 에이전시보다 훨씬 저렴하고 빠르게 받았어요!" },
  { user: "이**", rating: 5, date: "2026.03.10", content: "대량 주문했는데 퀄리티가 균일하게 잘 나왔습니다. 추천합니다." },
  { user: "박**", rating: 4, date: "2026.03.05", content: "전반적으로 만족합니다. 수정 요청도 빠르게 반영해주셨어요." },
];

const ServiceDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: service, isLoading } = useService(id);
  const { data: packages = [] } = useServicePackages(id);
  const { data: categories = [] } = useCategories();
  const [orderDialogOpen, setOrderDialogOpen] = useState(false);
  const [selectedPkg, setSelectedPkg] = useState<typeof packages[0] | null>(null);

  if (isLoading) {
    return (
      <MainLayout>
        <div className="max-w-7xl mx-auto px-4 py-16 text-center text-muted-foreground">로딩 중...</div>
      </MainLayout>
    );
  }

  if (!service) {
    return (
      <MainLayout>
        <div className="max-w-7xl mx-auto px-4 py-16 text-center text-muted-foreground">서비스를 찾을 수 없습니다.</div>
      </MainLayout>
    );
  }

  const category = categories.find((c) => c.id === service.category_id);
  const defaultTab = packages.length > 1 ? packages[1].name : packages[0]?.name || "Basic";

  const handleOrder = (pkg: typeof packages[0]) => {
    if (!user) {
      navigate("/login");
      return;
    }
    setSelectedPkg(pkg);
    setOrderDialogOpen(true);
  };

  const handleOrderSubmit = async (data: OrderFormData) => {
    setOrderDialogOpen(false);
    // Build metadata for chat room (exclude File objects)
    const orderRequest: Record<string, any> = {
      requesterName: data.requesterName,
      requesterEmail: data.requesterEmail,
      serviceTitle: data.serviceTitle,
      packageName: data.packageName,
      price: data.price,
      deliveryDays: data.deliveryDays,
      categoryName: data.categoryName,
    };
    if (data.refUrl) orderRequest.refUrl = data.refUrl;
    if (data.description) orderRequest.description = data.description;
    if (data.productionTime) orderRequest.productionTime = data.productionTime;
    if (data.quantity) orderRequest.quantity = data.quantity;
    if (data.subject) orderRequest.subject = data.subject;
    if (data.videoTime) orderRequest.videoTime = data.videoTime;
    if (data.llmOwned) orderRequest.llmOwned = data.llmOwned;
    if (data.pcMemory) orderRequest.pcMemory = data.pcMemory;
    if (data.aiAgentExp) orderRequest.aiAgentExp = data.aiAgentExp;
    if (data.files.length > 0) orderRequest.fileNames = data.files.map((f) => f.name);

    navigate("/chat", {
      state: {
        orderInfo: {
          serviceId: service.id,
          serviceTitle: service.title,
          packageName: data.packageName,
          price: data.price,
          deliveryDays: data.deliveryDays,
          orderRequest,
          files: data.files,
        },
      },
    });
  };

  const handleInquiry = () => {
    navigate("/chat", {
      state: {
        inquiry: {
          serviceId: service.id,
          serviceTitle: service.title,
        },
      },
    });
  };

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
            <div className="aspect-video rounded-xl overflow-hidden border">
              <img src={service.thumbnail || "/placeholder.svg"} alt={service.title} className="w-full h-full object-cover" />
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-accent text-accent-foreground">{category?.name}</span>
              </div>
              <h1 className="text-2xl font-bold text-foreground mb-3">{service.title}</h1>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{service.seller}</span>
                <span className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  {service.rating} ({service.review_count}개 리뷰)
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {service.delivery_days}일 이내 납품
                </span>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-semibold mb-3">서비스 설명</h2>
              <p className="text-muted-foreground leading-relaxed">{service.description}</p>
              {service.detailed_description && (
                <div className="mt-4 p-4 rounded-lg bg-accent/50">
                  <p className="text-sm text-muted-foreground leading-relaxed">{service.detailed_description}</p>
                </div>
              )}
            </div>

            {service.portfolio_images && service.portfolio_images.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold mb-3">포트폴리오</h2>
                <div className="grid grid-cols-2 gap-4">
                  {service.portfolio_images.map((img, idx) => (
                    <div key={idx} className="aspect-video rounded-lg overflow-hidden border">
                      <img src={img} alt={`포트폴리오 ${idx + 1}`} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {service.tags && service.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {service.tags.map((tag) => (
                  <span key={tag} className="px-3 py-1 text-sm rounded-full border text-muted-foreground">#{tag}</span>
                ))}
              </div>
            )}

            <div>
              <h2 className="text-lg font-semibold mb-4">리뷰 ({service.review_count})</h2>
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
                  {packages.length > 0 ? (
                    <Tabs defaultValue={defaultTab}>
                      <TabsList className="w-full rounded-none border-b">
                        {packages.map((pkg) => (
                          <TabsTrigger key={pkg.id} value={pkg.name} className="flex-1 text-sm">{pkg.name}</TabsTrigger>
                        ))}
                      </TabsList>
                      {packages.map((pkg) => (
                        <TabsContent key={pkg.id} value={pkg.name} className="p-5 space-y-4">
                          <div>
                            <span className="text-3xl font-bold text-foreground">{formatPrice(pkg.price)}원</span>
                            {service.original_price > pkg.price && (
                              <span className="ml-2 text-sm line-through text-muted-foreground">{formatPrice(service.original_price)}원</span>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground space-y-1">
                            <p>납기: {pkg.delivery_days}일</p>
                            <p>수정: {pkg.revisions}회</p>
                          </div>
                          {pkg.features && pkg.features.length > 0 && (
                            <ul className="space-y-2">
                              {pkg.features.map((f) => (
                                <li key={f} className="text-sm flex items-start gap-2">
                                  <span className="text-primary mt-0.5">✓</span>{f}
                                </li>
                              ))}
                            </ul>
                          )}
                          <div className="space-y-2 pt-2">
                            <Button className="w-full gap-2" onClick={() => handleOrder(pkg)}>
                              <ShoppingCart className="h-4 w-4" /> 의뢰하기
                            </Button>
                            <Button variant="outline" className="w-full gap-2" onClick={handleInquiry}>
                              <MessageCircle className="h-4 w-4" /> 채팅하기
                            </Button>
                          </div>
                        </TabsContent>
                      ))}
                    </Tabs>
                  ) : (
                    <div className="p-5 space-y-4">
                      <span className="text-3xl font-bold text-foreground">{formatPrice(service.price)}원</span>
                      <div className="space-y-2">
                        <Button className="w-full gap-2" onClick={handleInquiry}>
                          <MessageCircle className="h-4 w-4" /> 채팅하기
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {selectedPkg && (
        <OrderRequestDialog
          open={orderDialogOpen}
          onOpenChange={setOrderDialogOpen}
          service={{ id: service.id, title: service.title, category_id: service.category_id }}
          pkg={selectedPkg}
          categoryName={category?.name || "기타"}
          userName={user?.user_metadata?.name || user?.email?.split("@")[0] || ""}
          userEmail={user?.email || ""}
          onSubmit={handleOrderSubmit}
        />
      )}
    </MainLayout>
  );
};

export default ServiceDetailPage;
