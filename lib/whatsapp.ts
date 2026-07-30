export const WHATSAPP_URL =
  "https://wa.me/8613510947311?text=Hi%20TYORA,%20I%20have%20a%20product%20idea.";

const privateCustomReviewMessage =
  "Hi TYORA, I'd like a private custom product review. I will send my design and requirements here.";

export const PRIVATE_CUSTOM_REVIEW_WHATSAPP_URL =
  `https://wa.me/8613510947311?text=${encodeURIComponent(privateCustomReviewMessage)}`;

export function weeklySourceWhatsAppUrl(
  productCode: string,
  productTitle: string,
  language = "en"
) {
  const message = language === "zh-CN"
    ? `你好，我想了解 TYORA 本周爆款 ${productCode}（${productTitle}）的工厂价格、起订量和供应商资料。`
    : `Hi TYORA, I'd like the factory price, MOQ, and supplier details for weekly product ${productCode} (${productTitle}).`;
  return `https://wa.me/8613510947311?text=${encodeURIComponent(message)}`;
}

export function normalizeWhatsAppUrl(value?: string | null) {
  const trimmed = value?.trim();
  const legacyTestNumber = ["1555", "000", "000"].join("");

  if (!trimmed || trimmed.includes(legacyTestNumber)) {
    return WHATSAPP_URL;
  }

  return trimmed;
}
