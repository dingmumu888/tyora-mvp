import { createHash } from "node:crypto";

function safeHeader(value: string | null, maxLength = 180) {
  return (value || "").trim().slice(0, maxLength);
}

function decodeHeader(value: string | null) {
  const safe = safeHeader(value);
  if (!safe) return "";
  try {
    return decodeURIComponent(safe.replace(/\+/g, "%20"));
  } catch {
    return safe;
  }
}

export function requestIpAddress(headers: Headers) {
  const forwarded = safeHeader(headers.get("x-forwarded-for"));
  return (forwarded.split(",")[0] || safeHeader(headers.get("x-real-ip"))).trim();
}

export function maskIpAddress(ip: string) {
  if (!ip) return "";
  if (ip.includes(":")) {
    const parts = ip.split(":").filter(Boolean);
    return parts.length ? `${parts.slice(0, 3).join(":")}::` : "";
  }
  const parts = ip.split(".");
  return parts.length === 4 ? `${parts[0]}.${parts[1]}.x.x` : "";
}

export function hashIpAddress(ip: string) {
  if (!ip) return "";
  const salt = process.env.ANALYTICS_HASH_SALT || process.env.COMMUNITY_SESSION_SECRET || process.env.ADMIN_SESSION_SECRET || "tyora-analytics-v1";
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex");
}

export function requestGeo(headers: Headers) {
  const countryCode = safeHeader(headers.get("x-vercel-ip-country") || headers.get("cf-ipcountry"), 8).toUpperCase();
  return {
    countryCode,
    cityName: decodeHeader(headers.get("x-vercel-ip-city"))
  };
}

function sourceLabel(value: string) {
  const normalized = value.trim().toLowerCase();
  if (!normalized) return "";
  if (normalized.includes("google")) return "Google";
  if (normalized.includes("linkedin")) return "LinkedIn";
  if (normalized.includes("reddit")) return "Reddit";
  if (normalized.includes("facebook") || normalized === "fb") return "Facebook";
  if (normalized.includes("instagram")) return "Instagram";
  if (normalized.includes("tiktok")) return "TikTok";
  return normalized.slice(0, 1).toUpperCase() + normalized.slice(1, 40);
}

export function sourceFromTraffic(utmSource: string, referrer: string) {
  const campaignSource = sourceLabel(utmSource);
  if (campaignSource) return campaignSource;
  if (!referrer) return "Direct";
  try {
    const host = new URL(referrer).hostname.toLowerCase();
    if (host === "tyora.io" || host.endsWith(".tyora.io") || host.endsWith(".vercel.app")) return "Direct";
    return sourceLabel(host) || "Other";
  } catch {
    return "Other";
  }
}

export function trafficContext(request: Request, utmSource = "", referrer = "") {
  const ip = requestIpAddress(request.headers);
  const geo = requestGeo(request.headers);
  return {
    ...geo,
    referrerSource: sourceFromTraffic(utmSource, referrer),
    ipHash: hashIpAddress(ip),
    maskedIp: maskIpAddress(ip)
  };
}
