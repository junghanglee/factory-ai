import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Store, ShieldCheck } from "lucide-react";

interface SellerBadgeProps {
  sellerId: string | null;
  sellerName: string | null;
  /** If true, show as inline text with icon. If false, show as badge only. */
  variant?: "badge" | "inline";
}

/**
 * Displays seller origin: "AI팩토리" for in-house (no seller_id) or
 * "인증 판매자" with link for external sellers.
 */
const SellerBadge = ({ sellerId, sellerName, variant = "badge" }: SellerBadgeProps) => {
  const isInHouse = !sellerId;

  if (variant === "inline") {
    if (isInHouse) {
      return (
        <span className="flex items-center gap-1 text-xs text-primary font-medium">
          <ShieldCheck className="h-3.5 w-3.5" />
          AI팩토리
        </span>
      );
    }
    return (
      <Link to={`/seller/${sellerId}`} className="flex items-center gap-1 text-xs text-emerald-600 font-medium hover:underline">
        <Store className="h-3.5 w-3.5" />
        {sellerName || "인증 판매자"}
      </Link>
    );
  }

  // badge variant
  if (isInHouse) {
    return (
      <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-[18px] bg-primary/10 text-primary border-primary/20 gap-0.5">
        <ShieldCheck className="h-3 w-3" />
        AI팩토리
      </Badge>
    );
  }
  return (
    <Link to={`/seller/${sellerId}`}>
      <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-[18px] bg-emerald-50 text-emerald-700 border-emerald-200 gap-0.5 hover:bg-emerald-100">
        <Store className="h-3 w-3" />
        인증 판매자
      </Badge>
    </Link>
  );
};

export default SellerBadge;
