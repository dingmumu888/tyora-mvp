export function normalizeWhatsAppNumber(dialCode: string, localNumber: string) {
  const trimmed = localNumber.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("+")) {
    const internationalDigits = trimmed.slice(1).replace(/\D/g, "");
    return internationalDigits ? `+${internationalDigits}` : "";
  }

  const digits = trimmed.replace(/\D/g, "");
  const normalizedDialCode = `+${dialCode.replace(/\D/g, "")}`;
  return digits ? `${normalizedDialCode}${digits}` : "";
}

export function normalizeOptionalProductLink(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return { value: "", omittedInvalid: false };
  const candidate = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

  try {
    const url = new URL(candidate);
    if (!url.hostname.includes(".")) return { value: "", omittedInvalid: true };
    return { value: url.toString(), omittedInvalid: false };
  } catch {
    return { value: "", omittedInvalid: true };
  }
}

export function sanitizeOptionalProductLink(value: unknown) {
  if (typeof value !== "string") return "";
  return normalizeOptionalProductLink(value).value;
}
