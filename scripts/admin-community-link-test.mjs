import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const client = fs.readFileSync(path.join(root, "app", "admin", "community", "community-admin-client.tsx"), "utf8");
const component = fs.readFileSync(path.join(root, "components", "admin-view-community-link.tsx"), "utf8");
const failures = [];

if (!client.includes("AdminViewCommunityLink")) {
  failures.push("Community admin must render the shared public community link.");
}

if (!component.includes('href="/ask"')) {
  failures.push("Shared public community link must point to /ask.");
}

if (!component.includes('target="_blank"')) {
  failures.push("View Community should open in a new tab.");
}

if (!component.includes('rel="noreferrer"')) {
  failures.push("External new-tab community link should include rel=\"noreferrer\".");
}

if (failures.length) {
  console.error("Admin community link checks failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Admin community link checks passed.");
