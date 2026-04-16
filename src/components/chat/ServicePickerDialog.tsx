import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, MessageCircle, Clock } from "lucide-react";
import { useCategories, useServices } from "@/hooks/useSupabaseData";

interface ServicePickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectService: (service: { id: string; title: string; thumbnail: string | null; seller: string | null; price: number; rating: number; review_count: number; delivery_days: number }) => void;
}

import { formatPrice } from "@/utils/formatPrice";

export default function ServicePickerDialog({ open, onOpenChange, onSelectService }: ServicePickerDialogProps) {
  const { data: categories = [] } = useCategories();
  const { data: allServices = [] } = useServices();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  const filteredServices = useMemo(() => {
    if (!selectedCategoryId) return allServices;
    return allServices.filter((s) => s.category_id === selectedCategoryId);
  }, [allServices, selectedCategoryId]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle className="text-lg">서비스를 선택하고 문의를 시작하세요</DialogTitle>
        </DialogHeader>

        {/* Category tabs */}
        <div className="px-6 py-3 border-b">
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setSelectedCategoryId(null)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                !selectedCategoryId
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-secondary/50 text-muted-foreground border-transparent hover:bg-secondary"
              }`}
            >
              전체
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategoryId(cat.id)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                  selectedCategoryId === cat.id
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-secondary/50 text-muted-foreground border-transparent hover:bg-secondary"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Service list */}
        <ScrollArea className="flex-1 px-6 py-4">
          {filteredServices.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              등록된 서비스가 없습니다.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredServices.map((service) => (
                <button
                  key={service.id}
                  onClick={() =>
                    onSelectService({
                      id: service.id,
                      title: service.title,
                      thumbnail: service.thumbnail,
                      seller: service.seller,
                      price: service.price,
                      rating: service.rating,
                      review_count: service.review_count,
                      delivery_days: service.delivery_days,
                    })
                  }
                  className="flex gap-3 p-3 border rounded-xl text-left hover:border-primary/40 hover:shadow-md transition-all group bg-card"
                >
                  {/* Thumbnail */}
                  <div className="w-20 h-20 rounded-lg overflow-hidden shrink-0 bg-muted">
                    <img
                      src={service.thumbnail || "/placeholder.svg"}
                      alt={service.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>
                  {/* Info */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      {service.seller && (
                        <p className="text-[11px] text-muted-foreground mb-0.5">{service.seller}</p>
                      )}
                      <h4 className="text-sm font-medium line-clamp-2 leading-tight">{service.title}</h4>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-0.5">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          {service.rating}
                        </span>
                        <span className="flex items-center gap-0.5">
                          <Clock className="h-3 w-3" />
                          {service.delivery_days}일
                        </span>
                      </div>
                      <span className="text-sm font-bold text-primary">{formatPrice(service.price, (service as any).price_usd)}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
