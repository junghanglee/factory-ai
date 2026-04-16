import i18n from "i18next";

/**
 * Format price based on current language.
 * English → USD ($), Korean → KRW (원)
 */
export function formatPrice(krwPrice: number, usdPrice?: number | null): string {
  if (i18n.language === "en" && usdPrice != null) {
    return `$${usdPrice.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
  }
  return `${krwPrice.toLocaleString("ko-KR")}원`;
}

/**
 * Format a service's display price (handles price_text override).
 */
export function displayServicePrice(pkg: any): string {
  if (pkg.price_text) return pkg.price_text;
  return formatPrice(pkg.price, pkg.price_usd);
}

/**
 * Format original (crossed-out) price.
 */
export function formatOriginalPrice(service: any): string {
  return formatPrice(service.original_price, service.original_price_usd);
}
