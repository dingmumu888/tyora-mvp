import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const homeClient = fs.readFileSync(path.join(root, "app/home-client.tsx"), "utf8");

const checks = [
  {
    label: "homepage no longer stores state for a duplicate floating discussion CTA",
    pass:
      !homeClient.includes("mobileDiscussionCtaCollapsed") &&
      !homeClient.includes("sessionStorage.getItem") &&
      !homeClient.includes("sessionStorage.setItem")
  },
  {
    label: "homepage removes the legacy floating side tab",
    pass:
      !homeClient.includes('aria-label="Expand start discussion"') &&
      !homeClient.includes("writingMode")
  },
  {
    label: "homepage has no application-owned fixed right-side public control",
    pass: !/fixed[^\n]*(?:right-|inset-x)/.test(homeClient)
  }
];

const failed = checks.filter((check) => !check.pass);
if (failed.length) {
  console.error("Mobile floating discussion CTA checks failed:");
  for (const check of failed) console.error(`- ${check.label}`);
  process.exit(1);
}

console.log("Mobile floating discussion CTA checks passed.");
