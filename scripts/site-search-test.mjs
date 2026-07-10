import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const component = fs.existsSync(path.join(root, "components/site-search.tsx"))
  ? fs.readFileSync(path.join(root, "components/site-search.tsx"), "utf8")
  : "";
const home = fs.readFileSync(path.join(root, "app/home-client.tsx"), "utf8");

const checks = [
  {
    label: "site search component exists with static searchable index",
    pass:
      component.includes("const staticSearchItems") &&
      component.includes("Source This Product") &&
      component.includes("How TYORA Source Works") &&
      component.includes("Service protection") &&
      component.includes("Pricing")
  },
  {
    label: "site search queries public community ideas for keyword results",
    pass:
      component.includes("/api/community/ideas?sort=trending&limit=50") &&
      component.includes("communityResults") &&
      component.includes("idea.title") &&
      component.includes("idea.description")
  },
  {
    label: "site search has accessible input and result dropdown",
    pass:
      component.includes("placeholder=\"Search\"") &&
      component.includes("Search results") &&
      component.includes("No results found") &&
      component.includes("href={item.href}")
  },
  {
    label: "site search supports Enter and a colored submit button",
    pass:
      component.includes("useRouter") &&
      component.includes("function submitSearch") &&
      component.includes("<form") &&
      component.includes("onSubmit={submitSearch}") &&
      component.includes("type=\"submit\"") &&
      component.includes("aria-label=\"Open first search result\"") &&
      component.includes("bg-[#2563eb]")
  },
  {
    label: "homepage header uses live site search and removes Pricing nav item",
    pass:
      home.includes("import SiteSearch") &&
      home.includes("<SiteSearch") &&
      !home.includes("<SearchCheck size={15} /> Search") &&
      !home.includes("[\"Pricing\", \"/#pricing\"]")
  }
];

const failed = checks.filter((check) => !check.pass);

if (failed.length > 0) {
  console.error("Site search checks failed:");
  for (const check of failed) console.error(`- ${check.label}`);
  process.exit(1);
}

console.log("Site search checks passed.");
