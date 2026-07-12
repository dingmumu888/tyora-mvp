import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const schema = read("prisma/schema.prisma");
const analytics = read("lib/analytics.ts");
const store = read("lib/server/analytics-store.ts");
const traffic = read("lib/server/traffic-context.ts");
const layout = read("app/layout.tsx");
const home = read("app/home-client.tsx");
const build = read("app/build/build-client.tsx");
const trackerPath = path.join(root, "components/analytics-page-tracker.tsx");

const failures = [];
for (const field of ["utmSource", "utmMedium", "utmCampaign", "cityName", "ipHash", "maskedIp"]) {
  if (!schema.includes(field)) failures.push(`AnalyticsEvent is missing ${field}.`);
}
for (const field of ["utmSource", "utmMedium", "utmCampaign"]) {
  if (!analytics.includes(field)) failures.push(`Browser analytics payload is missing ${field}.`);
}
if (!store.includes("maskIpAddress") || !store.includes("hashIpAddress")) failures.push("Analytics store is missing IP privacy helpers.");
if (!traffic.includes("x-vercel-ip-city")) failures.push("Analytics traffic context does not read the Vercel city header.");
if (!store.includes("utmSource") || !store.includes("sourceFromTraffic")) failures.push("Analytics source priority is not UTM-aware.");
if (!fs.existsSync(trackerPath)) failures.push("Root analytics page tracker is missing.");
if (!layout.includes("AnalyticsPageTracker")) failures.push("Root layout does not mount AnalyticsPageTracker.");
if (home.includes('trackAnalyticsEvent("page_visit")')) failures.push("Homepage still emits a duplicate manual page visit.");
if (build.includes('trackAnalyticsEvent("page_visit")')) failures.push("Build page still emits a duplicate manual page visit.");

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}
console.log("Operations analytics V1 contract passed.");
