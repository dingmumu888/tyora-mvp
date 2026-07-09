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
