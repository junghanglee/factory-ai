import i18n from "i18next";

/**
 * Returns true when the UI is in English mode.
 */
export function isEnglishMode(): boolean {
  return i18n.language === "en";
}

/**
 * Get currency code based on current language.
 */
export function getCurrency(): "usd" | "krw" {
  return isEnglishMode() ? "usd" : "krw";
}

/**
 * Get the payment amount (in smallest unit) and currency for a package.
 * USD prices are in cents, KRW prices are whole numbers.
 */
export function getPaymentAmount(pkg: { price: number; price_usd?: number | null }): { amount: number; currency: "usd" | "krw" } {
  if (isEnglishMode() && pkg.price_usd != null) {
    return { amount: Math.round(pkg.price_usd * 100), currency: "usd" };
  }
  return { amount: pkg.price, currency: "krw" };
}

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

/**
 * Format a USD value as "$xx.xx".
 */
export function formatUsd(usd: number): string {
  return `$${usd.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

/**
 * Format a KRW value as "xx,xxx원".
 */
export function formatKrw(krw: number): string {
  return `${Math.round(krw).toLocaleString("ko-KR")}원`;
}

/**
 * Bilingual price string. Always returns BOTH currencies so users see what they
 * will be charged in USD (Paddle) alongside their local KRW reference.
 *
 * - English mode → "$xx.xx (≈ ₩xx,xxx)"
 * - Korean mode  → "xx,xxx원 (≈ $xx.xx)"
 *
 * If only one side is provided (no usd), the secondary part is omitted.
 */
export function formatPriceBilingual(krwPrice: number, usdPrice?: number | null): string {
  const hasUsd = usdPrice != null && usdPrice > 0;
  const hasKrw = krwPrice > 0;
  if (isEnglishMode()) {
    if (!hasUsd) return formatKrw(krwPrice);
    return hasKrw ? `${formatUsd(usdPrice!)} (≈ ${formatKrw(krwPrice)})` : formatUsd(usdPrice!);
  }
  // Korean mode
  if (!hasKrw && hasUsd) return formatUsd(usdPrice!);
  return hasUsd ? `${formatKrw(krwPrice)} (≈ ${formatUsd(usdPrice!)})` : formatKrw(krwPrice);
}
