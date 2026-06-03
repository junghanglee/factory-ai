import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Star, Package, MapPin, Store } from "lucide-react";
import MainLayout from "@/components/layout/MainLayout";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useCategories } from "@/hooks/useSupabaseData";
import { useTranslation } from "react-i18next";

import { formatPrice } from "@/utils/formatPrice";

const SellerProfilePage = () => {
  const { id } = useParams();
  const { data: categories = [] } = useCategories();
  const { t } = useTranslation();

  const { data: seller, isLoading } = useQuery({
    queryKey: ["seller-public", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await (supabase as any)
        .from("public_seller_profiles")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: services = [] } = useQuery({
    queryKey: ["seller-public-services", id],
    queryFn: async () => {
      if (!id) return [];
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .eq("seller_id", id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <MainLayout>
        <div className="max-w-7xl mx-auto px-4 py-16 text-center text-muted-foreground">{t("common.loading")}</div>
      </MainLayout>
    );
  }

  if (!seller) {
    return (
      <MainLayout>
        <div className="max-w-7xl mx-auto px-4 py-16 text-center text-muted-foreground">{t("seller.sellerNotFound")}</div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Seller header */}
        <div className="flex items-start gap-6 mb-10 p-6 border rounded-xl bg-card">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            {seller.profile_image ? (
              <img src={seller.profile_image} alt="" className="w-full h-full rounded-full object-cover" />
            ) : (
              <Store className="h-10 w-10 text-primary" />
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold">{seller.business_name}</h1>
              <Badge className="bg-green-100 text-green-700 border-green-200">{t("seller.verified")}</Badge>
            </div>
            {seller.bio && (
              <p className="text-muted-foreground mt-2 whitespace-pre-wrap">{seller.bio}</p>
            )}
            <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Package className="h-4 w-4" />
                {t("seller.services")} {services.length}
              </span>
              <span className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                {t("seller.sales")} {seller.total_sales || 0}
              </span>
            </div>
          </div>
        </div>

        {/* Services */}
        <h2 className="text-lg font-semibold mb-4">{t("seller.registeredServicesList")}</h2>
        {services.length === 0 ? (
          <p className="text-center py-12 text-muted-foreground">{t("seller.noServices")}</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service: any) => {
              const cat = categories.find(c => c.id === service.category_id);
              return (
                <Link key={service.id} to={`/service/${service.id}`}>
                  <Card className="overflow-hidden group hover:shadow-lg transition-all border-transparent hover:border-primary/20">
                    <div className="aspect-[4/3] overflow-hidden relative">
                      <img src={service.thumbnail || "/placeholder.svg"} alt={service.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                      {cat && (
                        <span className="absolute top-2 left-2 px-2 py-0.5 text-[11px] font-medium rounded-full bg-background/80 backdrop-blur-sm text-foreground border">
                          {cat.name}
                        </span>
                      )}
                    </div>
                    <CardContent className="p-4">
                      <h3 className="text-sm font-medium line-clamp-2 mb-2 min-h-[2.5rem]">{service.title}</h3>
                      <div className="flex items-center gap-1 mb-2">
                        <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm font-medium">{service.rating}</span>
                        <span className="text-xs text-muted-foreground">({service.review_count})</span>
                      </div>
                      <span className="text-lg font-bold">{formatPrice(service.price, (service as any).price_usd)}</span>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default SellerProfilePage;
