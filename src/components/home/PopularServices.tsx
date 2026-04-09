import { useState } from "react";
import { Link } from "react-router-dom";
import { Star, Plus } from "lucide-react";
import { useServices, useCategories, type DbService } from "@/hooks/useSupabaseData";

const formatPrice = (price: number) => price.toLocaleString("ko-KR");

const ServiceCard = ({ service }: { service: DbService }) => (
  <Link to={`/service/${service.id}`} className="group block">
    <div className="aspect-[4/3] rounded-lg overflow-hidden mb-3 bg-secondary">
      <img
        src={service.thumbnail || "/placeholder.svg"}
        alt={service.title}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        loading="lazy"
      />
    </div>
    <h3 className="text-[14px] text-foreground leading-snug line-clamp-2 mb-2 min-h-[2.5rem] font-normal">
      {service.title}
    </h3>
    <div className="flex items-center gap-1 mb-1.5">
      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
      <span className="text-[13px] font-medium text-foreground">{service.rating}</span>
      <span className="text-[13px] text-muted-foreground">({service.review_count})</span>
    </div>
    <p className="text-[15px] font-medium text-foreground">{formatPrice(service.price)}원~</p>
    <div className="flex items-center gap-1.5 mt-2">
      <div className="w-5 h-5 rounded-full bg-secondary flex items-center justify-center text-[10px] font-bold text-muted-foreground">
        {service.seller?.[0] || "A"}
      </div>
      <span className="text-[12px] text-muted-foreground">{service.seller}</span>
    </div>
  </Link>
);

const PopularServices = () => {
  const { data: allServices = [] } = useServices();
  const { data: categories = [] } = useCategories();
  const [activeTab, setActiveTab] = useState(0);

  const tabs = categories.slice(0, 6).map((c) => ({ label: c.name, categoryId: c.id }));
  const activeCatId = tabs[activeTab]?.categoryId;
  const filteredServices = activeCatId
    ? allServices.filter((s) => s.category_id === activeCatId)
    : allServices;
  const displayServices = filteredServices.length > 0 ? filteredServices.slice(0, 8) : allServices.slice(0, 8);

  return (
    <section className="py-12">
      <div className="max-w-[1200px] mx-auto px-5">
        <h2 className="text-[24px] md:text-[28px] font-bold text-foreground mb-6">
          인기 서비스
        </h2>
        <div className="flex gap-3 mb-6 overflow-x-auto pb-1">
          {tabs.map((tab, idx) => (
            <button
              key={tab.categoryId}
              onClick={() => setActiveTab(idx)}
              className={`flex items-center justify-between gap-4 px-5 py-2.5 rounded-lg border text-[14px] whitespace-nowrap transition-colors min-w-[140px] ${
                activeTab === idx
                  ? "border-foreground text-foreground font-medium"
                  : "border-border text-muted-foreground hover:border-foreground/30"
              }`}
            >
              <span>{tab.label}</span>
              <Plus className="h-4 w-4 shrink-0 text-muted-foreground" />
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          {displayServices.map((service) => (
            <ServiceCard key={service.id} service={service} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default PopularServices;
