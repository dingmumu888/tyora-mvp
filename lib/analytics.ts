export const analyticsEventTypes = [
  "page_visit",
  "whatsapp_click",
  "linkedin_click",
  "email_click",
  "upload_click",
  "lead_submit_success"
] as const;

export type AnalyticsEventType = (typeof analyticsEventTypes)[number];

export type AnalyticsMetric = {
  label: string;
  value: number;
  percentage?: number;
};

export type AnalyticsDailyRow = {
  date: string;
  visitors: number;
  pageViews: number;
  whatsappClicks: number;
  leadSubmissions: number;
};

export type AnalyticsRecentLead = {
  id: string;
  name: string;
  country: string;
  company: string;
  status: string;
  submissionTime: string;
};

export type AnalyticsDashboard = {
  summary: {
    visitorsToday: number;
    visitors7Days: number;
    visitors30Days: number;
    pageViewsToday: number;
    whatsappClicksToday: number;
    newLeadsToday: number;
    conversionRateToday: number;
    averageSessionDurationSeconds: number;
  };
  countries: AnalyticsMetric[];
  sources: AnalyticsMetric[];
  devices: AnalyticsMetric[];
  topPages: AnalyticsMetric[];
  ctaPerformance: AnalyticsMetric[];
  recentLeads: AnalyticsRecentLead[];
  funnel: AnalyticsMetric[];
  tasks: AnalyticsMetric[];
  insights: string[];
  dailyTrend: AnalyticsDailyRow[];
};

const VISITOR_COOKIE = "tyora_visitor_id";
const VISITOR_STORAGE_KEY = "tyora_visitor_id";
const SESSION_KEY = "tyora_session_id";
const SESSION_STARTED_KEY = "tyora_session_started_at";

function randomId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}_${crypto.randomUUID()}`;
  }
  return `${prefix}_${Date.now()}_${Math.round(Math.random() * 1000000)}`;
}

function getCookie(name: string) {
  if (typeof document === "undefined") return "";
  const match = document.cookie
    .split("; ")
    .find((part) => part.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.split("=").slice(1).join("=")) : "";
}

function setCookie(name: string, value: string) {
  if (typeof document === "undefined") return;
  const maxAge = 60 * 60 * 24 * 365;
  document.cookie = `${name}=${encodeURIComponent(value)}; Max-Age=${maxAge}; Path=/; SameSite=Lax`;
}

function getVisitorId() {
  const stored =
    typeof localStorage !== "undefined" ? localStorage.getItem(VISITOR_STORAGE_KEY) || "" : "";
  const existing = stored || getCookie(VISITOR_COOKIE);
  if (existing) return existing;
  const next = randomId("visitor");
  if (typeof localStorage !== "undefined") {
    localStorage.setItem(VISITOR_STORAGE_KEY, next);
  }
  setCookie(VISITOR_COOKIE, next);
  return next;
}

function getSessionId() {
  if (typeof sessionStorage === "undefined") return randomId("session");
  const existing = sessionStorage.getItem(SESSION_KEY);
  if (existing) return existing;
  const next = randomId("session");
  sessionStorage.setItem(SESSION_KEY, next);
  sessionStorage.setItem(SESSION_STARTED_KEY, String(Date.now()));
  return next;
}

function getSessionDurationSeconds() {
  if (typeof sessionStorage === "undefined") return 0;
  const startedAt = Number(sessionStorage.getItem(SESSION_STARTED_KEY) || Date.now());
  return Math.max(0, Math.round((Date.now() - startedAt) / 1000));
}

export function trackAnalyticsEvent(type: AnalyticsEventType, path?: string) {
  if (typeof window === "undefined") return;

  const body = {
    type,
    path: path || window.location.pathname,
    referrer: document.referrer || "",
    visitorId: getVisitorId(),
    sessionId: getSessionId(),
    sessionDurationSeconds: getSessionDurationSeconds()
  };

  const payload = JSON.stringify(body);
  if (navigator.sendBeacon) {
    const blob = new Blob([payload], { type: "application/json" });
    navigator.sendBeacon("/api/analytics", blob);
    return;
  }

  void fetch("/api/analytics", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: payload,
    keepalive: true
  }).catch(() => undefined);
}
