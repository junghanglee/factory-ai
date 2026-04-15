import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Search, Star, Clock } from "lucide-react";
import MainLayout from "@/components/layout/MainLayout";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";

interface ServiceResult {
  id: string;
  title: string;
  description: string | null;
  thumbnail: string | null;
  price: number;
  original_price: number;
  rating: number;
  review_count: number;
  delivery_days: number;
  tags: string[] | null;
}

const SearchPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const [searchInput, setSearchInput] = useState(query);
  const [results, setResults] = useState<ServiceResult[]>([]);
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    setSearchInput(query);
    if (query.trim()) fetchResults(query.trim());
    else setResults([]);
  }, [query]);

  const fetchResults = async (q: string) => {
    setLoading(true);
    const { data } = await supabase
      .from("services")
      .select("id, title, description, thumbnail, price, original_price, rating, review_count, delivery_days, tags")
      .or(`title.ilike.%${q}%,description.ilike.%${q}%`)
      .limit(50);
    setResults(data || []);
    setLoading(false);
  };

  const handleSearch = () => {
    if (searchInput.trim()) {
      setSearchParams({ q: searchInput.trim() });
    }
  };

  const discount = (orig: number, price: number) => {
    if (!orig || orig <= price) return 0;
    return Math.round(((orig - price) / orig) * 100);
  };

  return (
    <MainLayout>
      <div className="max-w-[1200px] mx-auto px-5 py-8">
        {/* Search bar */}
        <div className="relative max-w-[600px] mx-auto mb-8">
          <input
            type="text"
            placeholder={t("search.placeholder")}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="w-full h-[52px] pl-6 pr-16 rounded-full border-2 border-border bg-secondary/50 text-foreground text-[16px] placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition-colors"
          />
          <button
            onClick={handleSearch}
            className="absolute right-2 top-2 h-9 w-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/80 transition-colors"
          >
            <Search className="h-5 w-5" />
          </button>
        </div>

        {/* Results header */}
        {query && (
          <div className="mb-6">
            <h1 className="text-xl font-bold text-foreground">
              {t("search.results", { query })}
              <span className="text-muted-foreground text-base font-normal ml-2">({t("search.count", { count: results.length })})</span>
            </h1>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="text-center py-16 text-muted-foreground">{t("search.searching")}</div>
        )}

        {/* Empty state */}
        {!loading && query && results.length === 0 && (
          <div className="text-center py-16">
            <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground/40" />
            <p className="text-lg font-medium text-foreground mb-1">{t("search.noResults")}</p>
            <p className="text-sm text-muted-foreground">{t("search.tryOther")}</p>
          </div>
        )}

        {/* No query */}
        {!query && !loading && (
          <div className="text-center py-16">
            <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground/40" />
            <p className="text-lg font-medium text-foreground mb-1">{t("search.enterQuery")}</p>
            <p className="text-sm text-muted-foreground">{t("search.findServices")}</p>
          </div>
        )}

        {/* Results grid */}
        {!loading && results.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5">
            {results.map((service) => {
              const disc = discount(service.original_price, service.price);
              return (
                <Link key={service.id} to={`/service/${service.id}`} className="group">
                  <div className="rounded-xl overflow-hidden border bg-card hover:shadow-md transition-shadow">
                    <div className="aspect-[4/3] bg-secondary overflow-hidden">
                      {service.thumbnail ? (
                        <img src={service.thumbnail} alt={service.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">{t("search.noImage")}</div>
                      )}
                    </div>
                    <div className="p-3.5">
                      <h3 className="text-[14px] font-medium text-foreground line-clamp-2 mb-2 leading-snug group-hover:text-primary transition-colors">
                        {service.title}
                      </h3>
                      <div className="flex items-center gap-1.5 mb-2">
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                        <span className="text-xs font-medium text-foreground">{Number(service.rating).toFixed(1)}</span>
                        <span className="text-xs text-muted-foreground">({service.review_count})</span>
                      </div>
                      <div className="flex items-baseline gap-1.5">
                        {disc > 0 && <span className="text-sm font-bold text-destructive">{disc}%</span>}
                        <span className="text-[15px] font-bold text-foreground">{service.price.toLocaleString()}원</span>
                      </div>
                      {disc > 0 && (
                        <span className="text-xs text-muted-foreground line-through">{service.original_price.toLocaleString()}원</span>
                      )}
                      <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>{t("search.deliveryWithin", { days: service.delivery_days })}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default SearchPage;
