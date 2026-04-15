import i18n from "i18next";

/**
 * Returns the localized value of a DB field.
 * If current language is English and `_en` field exists, use it; otherwise fallback to Korean.
 */
export function localize<T extends Record<string, any>>(
  item: T,
  field: string
): string {
  if (i18n.language === "en") {
    const enValue = (item as any)[`${field}_en`];
    if (enValue) return enValue;
  }
  return (item as any)[field] || "";
}
