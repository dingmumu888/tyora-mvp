import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const homeClient = fs.readFileSync(path.join(root, "app/home-client.tsx"), "utf8");

const checks = [
  {
    label: "mobile discussion CTA stores collapsed state in sessionStorage",
    pass:
      homeClient.includes("mobileDiscussionCtaCollapsed") &&
      homeClient.includes("sessionStorage.getItem") &&
      homeClient.includes("sessionStorage.setItem")
  },
  {
    label: "mobile discussion CTA can render as a slim side tab",
    pass:
      homeClient.includes('aria-label="Expand start discussion"') &&
      homeClient.includes("Start") &&
      homeClient.includes("right-0") &&
      homeClient.includes("writingMode")
  },
  {
    label: "expanded mobile discussion CTA is narrower than old full-width banner",
    pass:
      homeClient.includes("max-w-[260px]") &&
      !homeClient.includes("max-w-md overflow-hidden rounded-[22px]")
  },
  {
    label: "expanded mobile discussion CTA has a collapse button",
    pass:
      homeClient.includes('aria-label="Collapse start discussion"') &&
      homeClient.includes("setMobileDiscussionCtaCollapsed(true)")
  }
];

const failed = checks.filter((check) => !check.pass);
if (failed.length) {
  console.error("Mobile floating discussion CTA checks failed:");
  for (const check of failed) console.error(`- ${check.label}`);
  process.exit(1);
}

console.log("Mobile floating discussion CTA checks passed.");
