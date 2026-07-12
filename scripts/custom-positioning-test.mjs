import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (...parts) => fs.readFileSync(path.join(root, ...parts), "utf8");

const customPagePath = path.join(root, "app", "custom", "page.tsx");
const home = read("app", "home-client.tsx");
const source = read("app", "source", "source-client.tsx");
const newIdea = read("app", "ask", "new", "new-idea-client.tsx");
const storage = read("lib", "storage.ts");
const i18n = read("lib", "i18n.ts");
const whatsapp = read("lib", "whatsapp.ts");

const failures = [];

if (!fs.existsSync(customPagePath)) {
  failures.push("Missing /custom page.");
} else {
  const custom = fs.readFileSync(customPagePath, "utf8");
  [
    "Develop a custom product with TYORA",
    "Free Custom Review",
    "Factory Introduction",
    "5% of estimated first order value, minimum $499",
    "Managed Custom Production",
    "15% of first order value, minimum $999",
    "Repeat Order Management",
    "10% of repeat order value, minimum $399",
    "approved reference sample",
    "does not add markup",
    "Start Private Review on WhatsApp",
    "Prefer email?",
    "mailto:support@tyora.io"
  ].forEach((text) => {
    if (!custom.includes(text)) failures.push(`/custom page missing: ${text}`);
  });
}

if (!whatsapp.includes("PRIVATE_CUSTOM_REVIEW_WHATSAPP_URL") || !whatsapp.includes("I will send my design and requirements here")) {
  failures.push("Private review WhatsApp message is missing.");
}

[
  '["Custom", "/custom"]',
  'title: "Start a private custom project"',
  'href: "/custom"',
  "Post publicly for a free manufacturing review, or send a private custom project to TYORA.",
  "Every public idea gets an initial TYORA manufacturing review."
].forEach((text) => {
  if (!home.includes(text)) failures.push(`Homepage missing: ${text}`);
});

if (home.includes("3 FREE Expert Reviews per day")) {
  failures.push("Homepage still says 3 FREE Expert Reviews per day.");
}

[
  '<Link href="/custom"',
  "Need to create a new custom product instead?",
  "Start Private Review on WhatsApp",
  "Example private sourcing requests"
].forEach((text) => {
  if (!source.includes(text)) failures.push(`Source page missing: ${text}`);
});

[
  "Public community discussion",
  "Your idea will be visible to everyone",
  "Every submitted idea gets an initial TYORA manufacturing review."
].forEach((text) => {
  if (!newIdea.includes(text)) failures.push(`New idea page missing: ${text}`);
});

if (newIdea.includes("limited to 3 per account per day") || newIdea.includes("Today's FREE Expert Reviews: 0 / 3 Used")) {
  failures.push("New idea page still contains old 3-review limit copy.");
}

[
  "Free Custom Review",
  "Factory Introduction",
  "Managed Custom Production",
  "Repeat Order Management",
  "5% of estimated first order value, minimum $499",
  "15% of first order value, minimum $999",
  "10% of repeat order value, minimum $399"
].forEach((text) => {
  if (!storage.includes(text)) failures.push(`Default pricing missing: ${text}`);
});

[
  "免费定制评估",
  "工厂介绍",
  "全程定制生产",
  "返单管理",
  "首单预估金额的 5%，最低 $499",
  "首单金额的 15%，最低 $999",
  "返单金额的 10%，最低 $399"
].forEach((text) => {
  if (!i18n.includes(text)) failures.push(`Chinese pricing missing: ${text}`);
});

if (storage.includes("price: \"$149 USD\"") || i18n.includes("price: \"$149 USD\"")) {
  failures.push("Old $149 custom pricing still exists.");
}

[
  "hasLegacyCustomPricing",
  "manufacturing-review",
  "full-project-management",
  "制造业回顾",
  "全面项目管理"
].forEach((text) => {
  if (!storage.includes(text)) failures.push(`Legacy pricing migration missing: ${text}`);
});

if (failures.length) {
  console.error("Custom positioning checks failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Custom positioning checks passed.");
