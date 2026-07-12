import { analyticsEventTypes, AnalyticsDashboard, AnalyticsEventType, AnalyticsMetric } from "@/lib/analytics";
import { prisma } from "@/lib/server/db";
import { hashIpAddress, maskIpAddress, sourceFromTraffic, trafficContext } from "@/lib/server/traffic-context";

export { hashIpAddress, maskIpAddress, sourceFromTraffic } from "@/lib/server/traffic-context";

const allowedEvents = new Set<string>(analyticsEventTypes);
const sourceLabels = ["Direct", "Google", "LinkedIn", "Reddit", "Facebook", "Other"];
const deviceLabels = ["Mobile", "Desktop", "Tablet"];

type AnalyticsInput = {
  type?: unknown;
  path?: unknown;
  referrer?: unknown;
  utmSource?: unknown;
  utmMedium?: unknown;
  utmCampaign?: unknown;
  visitorId?: unknown;
  sessionId?: unknown;
  sessionDurationSeconds?: unknown;
};

type EventRow = {
  type: string;
  path: string | null;
  pageGroup: string | null;
  referrerSource: string | null;
  cityName: string | null;
  countryName: string | null;
  countryCode: string | null;
  device: string | null;
  visitorId: string | null;
  ipHash: string | null;
  maskedIp: string | null;
  sessionId: string | null;
  sessionDurationSeconds: number | null;
  createdAt: Date;
};

function safeText(value: unknown, max = 260) {
  return typeof value === "string" ? value.slice(0, max) : "";
}

function safeId(value: unknown) {
  const text = safeText(value, 120);
  return /^[a-zA-Z0-9_\-:.]+$/.test(text) ? text : "";
}

function startOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function daysAgo(days: number) {
  const date = startOfDay(new Date());
  date.setDate(date.getDate() - days);
  return date;
}

function formatDay(date: Date) {
  return date.toISOString().slice(0, 10);
}

function pageGroup(path: string) {
  if (!path || path === "/") return "Homepage";
  if (path.includes("pricing")) return "Pricing";
  if (path.includes("case")) return "Case Studies";
  if (path.includes("founder") || path.includes("about")) return "Founder";
  return path.split("?")[0].slice(0, 80);
}

function deviceFromUserAgent(userAgent: string) {
  const value = userAgent.toLowerCase();
  if (value.includes("ipad") || value.includes("tablet")) return "Tablet";
  if (value.includes("mobile") || value.includes("iphone") || value.includes("android")) return "Mobile";
  return "Desktop";
}

function countryNameFromCode(code: string) {
  const upper = code.toUpperCase();
  const names: Record<string, string> = {
    AU: "Australia",
    CA: "Canada",
    CN: "China",
    DE: "Germany",
    FR: "France",
    GB: "United Kingdom",
    JP: "Japan",
    US: "United States"
  };
  return names[upper] || upper || "Unknown";
}

function percent(value: number, total: number) {
  return total > 0 ? Math.round((value / total) * 1000) / 10 : 0;
}

function uniqueVisitors(rows: EventRow[]) {
  const visitorIds = new Set<string>();
  const ipHashes = new Set<string>();
  let count = 0;
  rows.forEach((row) => {
    const knownVisitor = Boolean(row.visitorId && visitorIds.has(row.visitorId));
    const knownIp = Boolean(row.ipHash && ipHashes.has(row.ipHash));
    if (!knownVisitor && !knownIp && (row.visitorId || row.ipHash)) count += 1;
    if (row.visitorId) visitorIds.add(row.visitorId);
    if (row.ipHash) ipHashes.add(row.ipHash);
  });
  return count;
}

function recentVisitorRows(rows: EventRow[]) {
  const seenVisitors = new Set<string>();
  const seenIps = new Set<string>();
  return rows.flatMap((row) => {
    const key = row.visitorId || row.ipHash;
    if (!key || (row.visitorId && seenVisitors.has(row.visitorId)) || (row.ipHash && seenIps.has(row.ipHash))) return [];
    if (row.visitorId) seenVisitors.add(row.visitorId);
    if (row.ipHash) seenIps.add(row.ipHash);
    return [{
      id: key,
      path: row.path || "/",
      source: row.referrerSource || "Direct",
      country: row.countryName || "Unknown",
      city: row.cityName || "",
      device: row.device || "Unknown",
      maskedIp: row.maskedIp || "",
      visitedAt: row.createdAt.toISOString()
    }];
  }).slice(0, 20);
}

function countType(rows: EventRow[], type: AnalyticsEventType) {
  return rows.filter((row) => row.type === type).length;
}

function groupedMetrics(rows: EventRow[], key: keyof EventRow, labels?: string[]) {
  const total = rows.length;
  const counts = new Map<string, number>();
  labels?.forEach((label) => counts.set(label, 0));
  rows.forEach((row) => {
    const label = String(row[key] || "Unknown");
    counts.set(label, (counts.get(label) || 0) + 1);
  });
  return Array.from(counts.entries())
    .map(([label, value]) => ({ label, value, percentage: percent(value, total) }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);
}

function eventMetrics(rows: EventRow[], items: Array<[string, AnalyticsEventType]>) {
  const total = rows.length;
  return items.map(([label, type]) => {
    const value = countType(rows, type);
    return { label, value, percentage: percent(value, total) };
  });
}

function averageSessionDuration(rows: EventRow[]) {
  const latestBySession = new Map<string, number>();
  rows.forEach((row) => {
    if (!row.sessionId || !row.sessionDurationSeconds) return;
    latestBySession.set(row.sessionId, Math.max(latestBySession.get(row.sessionId) || 0, row.sessionDurationSeconds));
  });
  const values = Array.from(latestBySession.values()).filter((value) => value > 0);
  if (!values.length) return 0;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function recentLeadRows(rows: Awaited<ReturnType<typeof prisma.lead.findMany>>) {
  return rows.map((lead) => ({
    id: lead.id,
    name: lead.customerName || "-",
    country: lead.country || "-",
    company: lead.company || "-",
    status: lead.status,
    submissionTime: lead.submissionDate.toISOString()
  }));
}

function makeInsights({
  countries,
  sources,
  devices,
  whatsappClicks,
  visitors,
  leadSubmissions
}: {
  countries: AnalyticsMetric[];
  sources: AnalyticsMetric[];
  devices: AnalyticsMetric[];
  whatsappClicks: number;
  visitors: number;
  leadSubmissions: number;
}) {
  const insights: string[] = [];
  const topCountry = countries.find((item) => item.value > 0);
  const topSource = sources.find((item) => item.value > 0);
  const topDevice = devices.find((item) => item.value > 0);

  if (topCountry) insights.push(`Most unique visitors came from ${topCountry.label}.`);
  if (topSource) insights.push(`${topSource.label} generated the most traffic.`);
  if (topDevice) insights.push(`${topDevice.label} is the leading device type.`);
  if (visitors > 0) insights.push(`WhatsApp click rate is ${percent(whatsappClicks, visitors)}% today.`);
  if (visitors > 0) insights.push(`Lead conversion is ${percent(leadSubmissions, visitors)}% today.`);
  return insights.slice(0, 4);
}

export async function recordAnalyticsEvent(input: AnalyticsInput, request: Request) {
  const type = safeText(input.type, 40);
  if (!allowedEvents.has(type)) {
    throw new Error("Unsupported analytics event.");
  }

  const path = safeText(input.path || "/", 180) || "/";
  const referrer = safeText(input.referrer, 260);
  const utmSource = safeText(input.utmSource, 80);
  const utmMedium = safeText(input.utmMedium, 80);
  const utmCampaign = safeText(input.utmCampaign, 120);
  const context = trafficContext(request, utmSource, referrer);
  const countryCode = context.countryCode;
  const countryName = countryCode ? countryNameFromCode(countryCode) : "Unknown";
  const userAgent = request.headers.get("user-agent") || "";
  const duration = Number(input.sessionDurationSeconds);

  await prisma.analyticsEvent.create({
    data: {
      id: crypto.randomUUID(),
      type,
      path,
      pageGroup: pageGroup(path),
      referrer,
      referrerSource: context.referrerSource,
      utmSource: utmSource || null,
      utmMedium: utmMedium || null,
      utmCampaign: utmCampaign || null,
      countryCode: countryCode || null,
      countryName,
      cityName: context.cityName || null,
      device: deviceFromUserAgent(userAgent),
      visitorId: safeId(input.visitorId) || null,
      ipHash: context.ipHash || null,
      maskedIp: context.maskedIp || null,
      sessionId: safeId(input.sessionId) || null,
      sessionDurationSeconds: Number.isFinite(duration) ? Math.max(0, Math.min(86400, Math.round(duration))) : null
    }
  });
}

export async function getAnalyticsDashboard(): Promise<AnalyticsDashboard> {
  const today = startOfDay(new Date());
  const last7 = daysAgo(6);
  const last30 = daysAgo(29);

  const [events30, recentLeads, leadsToday, quotedLeads, productionLeads, waitingFollowUp, newCustomersToday] = await Promise.all([
    prisma.analyticsEvent.findMany({
      where: { createdAt: { gte: last30 } },
      orderBy: { createdAt: "desc" }
    }),
    prisma.lead.findMany({
      orderBy: { submissionDate: "desc" },
      take: 10
    }),
    prisma.lead.count({
      where: { submissionDate: { gte: today } }
    }),
    prisma.lead.count({
      where: { status: { in: ["Quoting", "Quoted"] } }
    }),
    prisma.lead.count({
      where: { status: { in: ["Sample Stage", "Production", "Shipment", "In Progress"] } }
    }),
    prisma.lead.count({
      where: {
        nextFollowUpDate: { lt: formatDay(today) },
        status: { notIn: ["Completed", "Lost", "Rejected"] }
      }
    }),
    prisma.communityUser.count({ where: { joinedAt: { gte: today } } })
  ]);

  const rows = events30 as EventRow[];
  const todayRows = rows.filter((row) => row.createdAt >= today);
  const sevenDayRows = rows.filter((row) => row.createdAt >= last7);
  const todayVisits = todayRows.filter((row) => row.type === "page_visit");
  const sevenDayVisits = sevenDayRows.filter((row) => row.type === "page_visit");
  const thirtyDayVisits = rows.filter((row) => row.type === "page_visit");
  const visitorsToday = uniqueVisitors(todayVisits);
  const pageViewsToday = todayVisits.length;
  const whatsappClicksToday = countType(todayRows, "whatsapp_click");

  const countries = groupedMetrics(thirtyDayVisits, "countryName");
  const sources = groupedMetrics(thirtyDayVisits, "referrerSource", sourceLabels);
  const devices = groupedMetrics(thirtyDayVisits, "device", deviceLabels);
  const topPages = groupedMetrics(thirtyDayVisits, "pageGroup");
  const ctaPerformance = eventMetrics(rows, [
    ["WhatsApp", "whatsapp_click"],
    ["Upload Your Idea", "upload_click"],
    ["LinkedIn", "linkedin_click"],
    ["Email", "email_click"]
  ]);

  const dailyTrend = Array.from({ length: 7 }).map((_, index) => {
    const date = daysAgo(6 - index);
    const day = formatDay(date);
    const dayRows = rows.filter((row) => formatDay(row.createdAt) === day);
    const dayVisits = dayRows.filter((row) => row.type === "page_visit");
    return {
      date: day,
      visitors: uniqueVisitors(dayVisits),
      pageViews: dayVisits.length,
      whatsappClicks: countType(dayRows, "whatsapp_click"),
      leadSubmissions: countType(dayRows, "lead_submit_success")
    };
  });

  const funnelVisitors = uniqueVisitors(thirtyDayVisits);
  const funnelWhatsApp = countType(rows, "whatsapp_click");
  const funnelLeads = countType(rows, "lead_submit_success");
  const funnel = [
    { label: "Unique Visitors", value: funnelVisitors, percentage: 100 },
    { label: "WhatsApp Clicks", value: funnelWhatsApp, percentage: percent(funnelWhatsApp, funnelVisitors) },
    { label: "Lead Submissions", value: funnelLeads, percentage: percent(funnelLeads, funnelVisitors) },
    { label: "Quoted", value: quotedLeads, percentage: percent(quotedLeads, Math.max(funnelLeads, 1)) },
    { label: "Production", value: productionLeads, percentage: percent(productionLeads, Math.max(funnelLeads, 1)) }
  ];

  const tasks = [
    { label: "New Leads", value: leadsToday },
    { label: "Need Follow-up", value: waitingFollowUp },
    { label: "Projects Waiting", value: quotedLeads },
    { label: "Unread Messages", value: 0 }
  ];

  return {
    summary: {
      visitorsToday,
      visitors7Days: uniqueVisitors(sevenDayVisits),
      visitors30Days: uniqueVisitors(thirtyDayVisits),
      pageViewsToday,
      whatsappClicksToday,
      newLeadsToday: leadsToday,
      conversionRateToday: percent(leadsToday, visitorsToday),
      averageSessionDurationSeconds: averageSessionDuration(todayRows),
      newCustomersToday
    },
    countries,
    sources,
    devices,
    topPages,
    ctaPerformance,
    recentLeads: recentLeadRows(recentLeads),
    recentVisitors: recentVisitorRows(thirtyDayVisits),
    funnel,
    tasks,
    insights: makeInsights({
      countries,
      sources,
      devices,
      whatsappClicks: whatsappClicksToday,
      visitors: visitorsToday,
      leadSubmissions: leadsToday
    }),
    dailyTrend
  };
}
