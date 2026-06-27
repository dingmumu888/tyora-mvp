export const WHATSAPP_URL =
  "https://wa.me/8613510947311?text=Hi%20TYORA,%20I%20have%20a%20product%20idea.";

export function normalizeWhatsAppUrl(value?: string | null) {
  const trimmed = value?.trim();
  const legacyTestNumber = ["1555", "000", "000"].join("");

  if (!trimmed || trimmed.includes(legacyTestNumber)) {
    return WHATSAPP_URL;
  }

  return trimmed;
}
