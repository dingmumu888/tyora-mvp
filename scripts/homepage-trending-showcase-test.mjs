import { readFileSync } from "node:fs";

const source = readFileSync("app/home-client.tsx", "utf8");

const checks = [
  {
    name: "homepage computes a ranked top-three community showcase",
    pass: source.includes("topShowcaseIdeas") && source.includes("homepageIdeaScore") && source.includes(".slice(0, 3)")
  },
  {
    name: "homepage does not filter real community posts out of the showcase request",
    pass: !source.includes(".filter(isHomepageReadyIdea)")
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
    name: "real top showcase cards link to all ideas",
    pass: source.includes('href="/ask"') && source.includes("topShowcaseIdeas.map")
  },
  {
    name: "homepage renders real TYORA review summaries with a two-line clamp",
    pass:
      source.includes("function homepageReviewSummary") &&
      source.includes("TYORA REVIEW") &&
      source.includes("TYORA review pending") &&
      source.includes("line-clamp-2 font-semibold text-[#101216]")
  },
  {
    name: "homepage no longer renders stored manufacturing question chips",
    pass: !source.includes('idea.questions[0] || "Manufacturing"')
  },
  {
    name: "HOT badge is rendered inside the homepage image wrapper",
    pass: /data-testid="homepage-idea-image"[\s\S]{0,500}<HotBadge idea=\{idea\}/.test(source)
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
