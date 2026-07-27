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

if (source.includes("/api/community/stats") || source.includes("communityTotals") || source.includes("sourceRequestCount")) {
  failures.push("Homepage must not display activity totals or imply unsupported traction.");
}

if (!source.includes("featuredCases") || !source.includes("communityEmptyTitle")) {
  failures.push("Homepage needs CMS case content and a compact zero-community fallback.");
}

if (failures.length) {
  console.error("Homepage trust cleanup checks failed:");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log("Homepage trust cleanup checks passed.");
