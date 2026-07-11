import fs from "node:fs";

const source = fs.readFileSync("app/home-client.tsx", "utf8");
const failures = [];

[
  "function ideaViews",
  "Founders Online",
  "Products Built",
  "Journey of the Week",
  "Featured Journey",
  "Products Built by Community",
  "moduleVisibility.pricing",
  "moduleVisibility.build",
  "moduleVisibility.founder",
  "moduleVisibility.faq"
].forEach((text) => {
  if (source.includes(text)) failures.push(`Homepage still contains unsupported or duplicated content: ${text}`);
});

if (!source.includes("Real public discussions")) {
  failures.push("Homepage should label the community count as real public discussions.");
}

if (!source.includes("/api/community/stats") || !fs.existsSync("app/api/community/stats/route.ts")) {
  failures.push("Homepage totals must come from the complete community stats endpoint, not the 12-card showcase sample.");
}

if (failures.length) {
  console.error("Homepage trust cleanup checks failed:");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log("Homepage trust cleanup checks passed.");
