import type { PublicLanguage } from "@/lib/public-i18n";

export const PUBLIC_DISCLOSURE_NOTICE_VERSION = "2026-08-01-v1";

const supportedPublicDisclosureLocales = new Set<PublicLanguage>([
  "en",
  "zh-CN",
  "es",
  "fr",
  "de",
  "pt"
]);

export function isPublicDisclosureLocale(value: unknown): value is PublicLanguage {
  return typeof value === "string" && supportedPublicDisclosureLocales.has(value as PublicLanguage);
}
