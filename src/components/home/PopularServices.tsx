import { useState } from "react";
import { Link } from "react-router-dom";
import { Star, Plus } from "lucide-react";
import { services, type Service } from "@/data/services";

const formatPrice = (price: number) => price.toLocaleString("ko-KR");

// Grouped service sections like kmong's "~가 많이 찾아요" pattern
const sections = [
  {
    title: "AI 콘텐츠",
    highlight: "가 필요할 때",
    tabs: [
      { label: "로고 디자인", categoryId: "ai-image" },
      { label: "상세페이지", categoryId: "ai-image" },
      { label: "숏폼 영상", categoryId: "ai-video" },
      { label: "광고 소재", categoryId: "ai-ads" },
    ],
  },
  {
    title: "마케팅/글쓰기",
    highlight: "가 필요할 때",
    tabs: [
      { label: "블로그 글", categoryId: "ai-writing" },
      { label: "광고카피", categoryId: "ai-writing" },
      { label: "배경음악", categoryId: "ai-music" },
      { label: "AI 챗봇", categoryId: "ai-assistant" },
    ],
  },
];

const ServiceCard = ({ service }: { service: Service }) => (
  <Link to={`/service/${service.id}`} className="group block">
    <div className="aspect-[4/3] rounded-lg overflow-hidden mb-3 bg-secondary">
      <img
        src={service.thumbnail}
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
      <span className="text-[13px] text-muted-foreground">({service.reviewCount})</span>
    </div>
    <p className="text-[15px] font-medium text-foreground">{formatPrice(service.price)}원~</p>
    <div className="flex items-center gap-1.5 mt-2">
      <div className="w-5 h-5 rounded-full bg-secondary flex items-center justify-center text-[10px] font-bold text-muted-foreground">
        {service.seller[0]}
      </div>
      <span className="text-[12px] text-muted-foreground">{service.seller}</span>
    </div>
  </Link>
);

const TabbedSection = ({
  title,
  highlight,
  tabs,
}: {
  title: string;
  highlight: string;
  tabs: { label: string; categoryId: string }[];
}) => {
  const [activeTab, setActiveTab] = useState(0);

  // Get services for the active tab (cycling through available services for demo)
  const tabServices = services.filter((s) => s.categoryId === tabs[activeTab].categoryId);
  const displayServices = tabServices.length >= 4 ? tabServices.slice(0, 4) : [...services].slice(0, 4);

  return (
    <section className="py-12">
      <div className="max-w-[1200px] mx-auto px-5">
        <div className="flex flex-col md:flex-row md:items-start gap-6 md:gap-12">
          {/* Left title */}
          <div className="shrink-0 md:w-[200px] md:pt-1">
            <h2 className="text-[24px] md:text-[28px] font-bold text-foreground leading-tight">
              <span className="text-foreground">{title}</span>
              {highlight}
            </h2>
          </div>

          {/* Right content */}
          <div className="flex-1 min-w-0">
            {/* Tabs */}
            <div className="flex gap-3 mb-6 overflow-x-auto pb-1">
              {tabs.map((tab, idx) => (
                <button
                  key={tab.label}
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

            {/* Service cards grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
              {displayServices.map((service) => (
                <ServiceCard key={service.id} service={service} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const PopularServices = () => {
  return (
    <>
      {sections.map((section, idx) => (
        <div key={section.title}>
          {idx > 0 && <div className="border-t border-border" />}
          <TabbedSection
            title={section.title}
            highlight={section.highlight}
            tabs={section.tabs}
          />
        </div>
      ))}
    </>
  );
};

export default PopularServices;
