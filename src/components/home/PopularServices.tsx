import { Link } from "react-router-dom";
import { Star } from "lucide-react";
import { services } from "@/data/services";
import { Card, CardContent } from "@/components/ui/card";

const formatPrice = (price: number) => price.toLocaleString("ko-KR");

const PopularServices = () => {
  return (
    <section className="py-16 bg-secondary/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-foreground">인기 서비스</h2>
          <Link to="/category/ai-image" className="text-sm text-primary hover:underline">
            전체보기 →
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.slice(0, 8).map((service) => (
            <Link key={service.id} to={`/service/${service.id}`}>
              <Card className="overflow-hidden group hover:shadow-lg transition-all duration-200 border-transparent hover:border-primary/20">
                <div className="aspect-[4/3] overflow-hidden">
                  <img
                    src={service.thumbnail}
                    alt={service.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                </div>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground mb-1">{service.seller}</p>
                  <h3 className="text-sm font-medium text-foreground line-clamp-2 mb-2 leading-snug min-h-[2.5rem]">
                    {service.title}
                  </h3>
                  <div className="flex items-center gap-1 mb-2">
                    <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-medium">{service.rating}</span>
                    <span className="text-xs text-muted-foreground">({service.reviewCount})</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-lg font-bold text-foreground">
                      {formatPrice(service.price)}원
                    </span>
                    <span className="text-sm text-muted-foreground line-through">
                      {formatPrice(service.originalPrice)}원
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-destructive/10 text-destructive">
                      {Math.round((1 - service.price / service.originalPrice) * 100)}% 할인
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {service.deliveryDays}일 이내
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PopularServices;
