import fs from "node:fs";
import path from "node:path";

const componentPath = path.join(process.cwd(), "components/mobile-bottom-tabs.tsx");
const component = fs.readFileSync(componentPath, "utf8");

const checks = [
  {
    label: "Source Product targets the source form instead of the current page root",
    pass: component.includes('href="/source#source-form"')
  },
  {
    label: "Same-page Source Product taps scroll the form into view on mobile Safari",
    pass:
      component.includes('document.getElementById("source-form")') &&
      component.includes('scrollIntoView({ behavior: "smooth", block: "start" })')
  },
  {
    label: "Source Product closes the create menu before navigating or scrolling",
    pass: component.includes("function openSourceForm") && component.includes("setCreateOpen(false)")
  }
];

const failed = checks.filter((check) => !check.pass);
if (failed.length) {
  console.error("Mobile post Source Product navigation checks failed:");
  for (const check of failed) console.error(`- ${check.label}`);
  process.exit(1);
}

console.log("Mobile post Source Product navigation checks passed.");
