import { readFileSync } from "node:fs";

const source = readFileSync("app/home-client.tsx", "utf8");

const checks = [
  {
    name: "homepage computes a CMS-limited ranked community showcase",
    pass: source.includes("eligibleIdeas") && source.includes("ideaScore") && source.includes("homepage.communityLimit")
  },
  {
    name: "homepage only shows real eligible public reviewed posts",
    pass:
      source.includes('idea.visibility === "Public"') &&
      source.includes("!idea.hidden") &&
      source.includes("idea.imageUrls.length > 0") &&
      source.includes("Boolean(reviewSummary(idea))")
  },
  {
    name: "homepage showcase never uses starter examples as fake post cards",
    pass: !source.includes("const homeExamples") && !source.includes("homeExamples.map")
  },
  {
    name: "starter/example showcase cards link to all ideas, not create idea",
    pass: !source.includes('key={example.title} href="/ask/new"')
  },
  {
    name: "real showcase cards link to their exact idea",
    pass: source.includes('href={`/ask/${idea.slug}`}') && source.includes("eligibleIdeas.map")
  },
  {
    name: "homepage renders real TYORA review summaries with a bounded clamp",
    pass:
      source.includes("function reviewSummary") &&
      source.includes("TYORA Review") &&
      source.includes("line-clamp-3") &&
      !source.includes("TYORA review pending")
  },
  {
    name: "homepage no longer renders stored manufacturing question chips",
    pass: !source.includes('idea.questions[0] || "Manufacturing"')
  },
  {
    name: "legacy HOT overlay cannot collide with homepage metadata",
    pass: !source.includes("function HotBadge") && !source.includes("<HotBadge")
  }
];

const failed = checks.filter((check) => !check.pass);

if (failed.length > 0) {
  console.error("Homepage trending showcase checks failed:");
  for (const check of failed) {
    console.error(`- ${check.name}`);
  }
  process.exit(1);
}

console.log("Homepage trending showcase checks passed.");
