import fs from "node:fs";

const read = (path) => fs.readFileSync(path, "utf8");
const failures = [];

const globals = read("app/globals.css");
const home = read("app/home-client.tsx");
const ask = read("app/ask/page.tsx");
const source = read("app/source/source-client.tsx");
const storage = read("lib/storage.ts");
const layout = read("app/layout.tsx");
const legalShell = read("components/legal-page-shell.tsx");
const privacy = read("app/privacy-policy/page.tsx");
const terms = read("app/terms/page.tsx");
const serviceScope = read("app/service-scope/page.tsx");

[
  "--color-navy: #071b3a",
  "--color-primary: #155eef",
  "--color-orange: #f9733d",
  "--color-text: #101828",
  "--color-border: #e4e7ec",
  "--focus-ring"
].forEach((token) => {
  if (!globals.includes(token)) failures.push(`Missing shared design token: ${token}`);
});

if (!layout.includes("TYORA | Product Development & Manufacturing in China")) {
  failures.push("Root metadata does not use the approved TYORA positioning.");
}

if (!storage.includes('email: "support@tyora.io"') || !storage.includes('linkedInLink: ""')) {
  failures.push("Safe contact and LinkedIn defaults are missing.");
}

if ((storage.match(/visible: false/g) || []).length < 3) {
  failures.push("Default placeholder cases are not reversibly hidden.");
}

if (home.includes("starterExamples") || home.includes('["TY", "CM"]')) {
  failures.push("Homepage still contains fabricated examples or participant avatars.");
}

if (ask.includes("creators online") || ask.includes("starterExamples") || ask.includes("Products Built")) {
  failures.push("Community discovery still contains fabricated activity or outcomes.");
}

if (source.includes("Example private sourcing requests") || source.includes("Factory quote sent privately")) {
  failures.push("Source page still contains fabricated request activity.");
}

if (!source.includes("{sourceCopy.title}") || !source.includes("{sourceCopy.ctaText}")) {
  failures.push("Source hero and CTA are no longer CMS-managed.");
}

if (!serviceScope.includes("No hidden product markup.") ||
    !serviceScope.includes("You see the factory quotation and pay a clearly agreed TYORA service fee.") ||
    !serviceScope.includes("Supporting factory quotations and payment records may be provided when applicable")) {
  failures.push("Approved transparency language is incomplete.");
}

for (const [name, sourceText] of [["privacy", privacy], ["terms", terms], ["service scope", serviceScope]]) {
  if (!sourceText.includes("LegalPageShell")) failures.push(`${name} page does not use the shared legal foundation.`);
  if (sourceText.includes("Idea2Product")) failures.push(`${name} page contains the retired brand.`);
}

if (!legalShell.includes("support@tyora.io") || !legalShell.includes("/service-scope")) {
  failures.push("Shared legal navigation or contact is incomplete.");
}

if (!fs.existsSync("docs/phase-1b-content-cleanup.md")) {
  failures.push("Phase 1B cleanup record is missing.");
}

if (failures.length) {
  console.error("Phase 1B foundation checks failed:");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log("Phase 1B foundation checks passed.");
