function configuredOrigin() {
  const value =
    process.env.AUTH_ORIGIN ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITE_URL ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL;

  if (!value) return "";
  const trimmed = value.trim().replace(/\/+$/, "");
  if (!trimmed) return "";
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

export function authUrl(path: string, request: Request) {
  const origin = configuredOrigin();
  return new URL(path, origin || request.url).toString();
}
