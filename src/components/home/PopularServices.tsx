import { useState } from "react";
import { Link } from "react-router-dom";
import { Star, Plus, ShieldCheck, Store } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";
import { localize } from "@/utils/localize";
import { formatPrice } from "@/utils/formatPrice";
import { useAuth } from "@/hooks/useAuth";

interface ServicePackage {
  id: string;
  service_id: string;
  price: number;
  price_usd: number | null;
  price_text: string | null;
  sort_order: number;
}

interface Service {
  id: string;
  title: string;
  thumbnail: string | null;
  price: number;
  price_usd: number | null;
  rating: number;
  review_count: number;
  seller: string | null;
  seller_id?: string | null;
  first_package?: ServicePackage | null;
}

interface DisplayGroup {
  id: string;
  title: string;
  title_en?: string | null;
  sort_order: number;
  active: boolean;
  font_size?: number;
  font_color?: string;
  highlight_color?: string;
}

interface DisplayFilter {
  id: string;
  group_id: string;
  name: string;
  name_en?: string | null;
  sort_order: number;
}

interface DisplayGroupService {
  id: string;
  group_id: string;
  filter_id: string | null;
  service_id: string;
  sort_order: number;
}

const ServiceCard = ({ service }: { service: Service }) => {
  const { t } = useTranslation();
  return (
  <Link to={`/service/${service.id}`} className="group block">
    <div className="aspect-[4/3] rounded-lg overflow-hidden mb-3 bg-secondary relative">
      <img
        src={service.thumbnail || "/placeholder.svg"}
        alt={localize(service, "title")}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        loading="lazy"
      />
      <div className="absolute top-2 left-2">
        {!service.seller_id ? (
          <span className="flex items-center gap-0.5 bg-primary/90 text-white text-[10px] font-medium px-1.5 py-0.5 rounded">
            <ShieldCheck className="h-3 w-3" />
          </span>
        ) : (
          <span className="flex items-center gap-0.5 bg-emerald-600/90 text-white text-[10px] font-medium px-1.5 py-0.5 rounded">
            <Store className="h-3 w-3" />
            {t("serviceCard.verifiedSeller")}
          </span>
        )}
      </div>
    </div>
    <h3 className="text-[14px] text-foreground leading-snug line-clamp-2 mb-2 min-h-[2.5rem] font-normal">
      {localize(service, "title")}
    </h3>
    <div className="flex items-center gap-1 mb-1.5">
      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
      <span className="text-[13px] font-medium text-foreground">{service.rating}</span>
      <span className="text-[13px] text-muted-foreground">({service.review_count})</span>
    </div>
    <p className="text-[15px] font-medium text-foreground">
      {service.first_package?.price_text
        ? service.first_package.price_text
        : service.first_package
          ? `${formatPrice(service.first_package.price, service.first_package.price_usd)}~`
          : `${formatPrice(service.price, service.price_usd)}~`}
    </p>
    <div className="flex items-center gap-1.5 mt-2">
      <div className="w-5 h-5 rounded-full bg-secondary flex items-center justify-center text-[10px] font-bold text-muted-foreground">
        {service.seller?.[0] || "A"}
      </div>
      <span className="text-[12px] text-muted-foreground">{service.seller}</span>
    </div>
  </Link>
  );
};

function renderStyledTitle(title: string, fontSize?: number, fontColor?: string, highlightColor?: string) {
  const size = fontSize || 26;
  const style: React.CSSProperties = { fontSize: `${size}px` };
  if (fontColor) style.color = fontColor;

  // Support **highlighted** syntax
  if (highlightColor && title.includes("**")) {
    const parts = title.split(/(\*\*[^*]+\*\*)/g);
    return (
      <h2 className="font-bold leading-tight whitespace-pre-line" style={style}>
        {parts.map((part, i) => {
          if (part.startsWith("**") && part.endsWith("**")) {
            return <span key={i} style={{ color: highlightColor }}>{part.slice(2, -2)}</span>;
          }
          return <span key={i}>{part}</span>;
        })}
      </h2>
    );
  }

  return (
    <h2 className="font-bold leading-tight whitespace-pre-line" style={style}>
      {title}
    </h2>
  );
}

function DisplayGroupSection({ group, filters, groupServices, allServices }: {
  group: DisplayGroup;
  filters: DisplayFilter[];
  groupServices: DisplayGroupService[];
  allServices: Service[];
}) {
  const { t } = useTranslation();
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  const visibleServiceIds = activeFilter
    ? groupServices.filter(gs => gs.filter_id === activeFilter).sort((a, b) => a.sort_order - b.sort_order).map(gs => gs.service_id)
    : groupServices.sort((a, b) => a.sort_order - b.sort_order).map(gs => gs.service_id);

  const uniqueServiceIds = activeFilter ? visibleServiceIds : [...new Set(visibleServiceIds)];

  const services = uniqueServiceIds
    .map(id => allServices.find(s => s.id === id))
    .filter(Boolean) as Service[];

  if (services.length === 0 && filters.length === 0) return null;

  return (
    <section className="py-10">
      <div className="max-w-[1200px] mx-auto px-5">
        <div className="flex flex-col md:flex-row gap-6 md:gap-10">
          <div className="md:w-[200px] shrink-0">
            {renderStyledTitle(localize(group, "title"), (group as any).font_size, (group as any).font_color, (group as any).highlight_color)}
          </div>

          <div className="flex-1 min-w-0">
            {filters.length > 0 && (
              <div className="flex gap-3 mb-6 overflow-x-auto pb-1">
                <button
                  onClick={() => setActiveFilter(null)}
                  className={`flex items-center justify-between gap-4 px-5 py-2.5 rounded-lg border text-[14px] whitespace-nowrap transition-colors min-w-[120px] ${
                    activeFilter === null
                      ? "border-foreground text-foreground font-medium"
                      : "border-border text-muted-foreground hover:border-foreground/30"
                  }`}
                >
                  <span>{t("common.all")}</span>
                  <Plus className="h-4 w-4 shrink-0 text-muted-foreground" />
                </button>
                {filters.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setActiveFilter(f.id)}
                    className={`flex items-center justify-between gap-4 px-5 py-2.5 rounded-lg border text-[14px] whitespace-nowrap transition-colors min-w-[120px] ${
                      activeFilter === f.id
                        ? "border-foreground text-foreground font-medium"
                        : "border-border text-muted-foreground hover:border-foreground/30"
                    }`}
                  >
                    <span>{localize(f, "name")}</span>
                    <Plus className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </button>
                ))}
              </div>
            )}

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
              {services.map((service) => (
                <ServiceCard key={service.id} service={service} />
              ))}
              {services.length === 0 && (
                <p className="text-sm text-muted-foreground col-span-full">{t("serviceCard.noServices")}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

const PopularServices = () => {
  const { data: groups = [] } = useQuery({
    queryKey: ["display_groups_public"],
    queryFn: async () => {
      const { data, error } = await supabase.from("display_groups").select("*").eq("active", true).order("sort_order");
      if (error) throw error;
      return data as DisplayGroup[];
    },
  });

  const { data: filters = [] } = useQuery({
    queryKey: ["display_group_filters_public"],
    queryFn: async () => {
      const { data, error } = await supabase.from("display_group_filters").select("*").order("sort_order");
      if (error) throw error;
      return data as DisplayFilter[];
    },
  });

  const { data: groupServices = [] } = useQuery({
    queryKey: ["display_group_services_public"],
    queryFn: async () => {
      const { data, error } = await supabase.from("display_group_services").select("*").order("sort_order");
      if (error) throw error;
      return data as DisplayGroupService[];
    },
  });

  const { data: allServices = [] } = useQuery({
    queryKey: ["services_for_display"],
    queryFn: async () => {
      const { data: svcs, error } = await supabase.from("services").select("id, title, title_en, thumbnail, price, price_usd, rating, review_count, seller, seller_id");
      if (error) throw error;
      const { data: pkgs, error: pErr } = await supabase.from("service_packages").select("id, service_id, price, price_usd, price_text, sort_order").order("sort_order");
      if (pErr) throw pErr;
      return (svcs as Service[]).map(s => ({
        ...s,
        first_package: (pkgs as ServicePackage[]).find(p => p.service_id === s.id) || null,
      }));
    },
  });

  if (groups.length === 0) return null;

  return (
    <>
      {groups.map((group) => (
        <DisplayGroupSection
          key={group.id}
          group={group}
          filters={filters.filter(f => f.group_id === group.id)}
          groupServices={groupServices.filter(gs => gs.group_id === group.id)}
          allServices={allServices}
        />
      ))}
    </>
  );
};

export default PopularServices;
