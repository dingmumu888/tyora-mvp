import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (...parts) => fs.readFileSync(path.join(root, ...parts), "utf8");

const customPagePath = path.join(root, "app", "custom", "page.tsx");
const home = read("app", "home-client.tsx");
const source = read("app", "source", "source-client.tsx");
const newIdea = read("app", "ask", "new", "new-idea-client.tsx");

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
    "does not add markup"
  ].forEach((text) => {
    if (!custom.includes(text)) failures.push(`/custom page missing: ${text}`);
  });
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
  "Start a Private Custom Project",
  "Example private sourcing requests"
].forEach((text) => {
  if (!source.includes(text)) failures.push(`Source page missing: ${text}`);
});

[
  "Private Custom Project",
  "Only you and TYORA can view this custom project.",
  "Every submitted idea gets an initial TYORA manufacturing review."
].forEach((text) => {
  if (!newIdea.includes(text)) failures.push(`New idea page missing: ${text}`);
});

if (newIdea.includes("limited to 3 per account per day") || newIdea.includes("Today's FREE Expert Reviews: 0 / 3 Used")) {
  failures.push("New idea page still contains old 3-review limit copy.");
}

if (failures.length) {
  console.error("Custom positioning checks failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Custom positioning checks passed.");
