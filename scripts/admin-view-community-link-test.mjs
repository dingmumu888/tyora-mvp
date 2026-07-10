import { readFileSync } from "node:fs";

const componentPath = "components/admin-view-community-link.tsx";
const adminFiles = [
  "app/admin/page.tsx",
  "app/admin/community/community-admin-client.tsx",
  "app/admin/source/source-admin-client.tsx",
  "app/admin/work-orders/work-orders-admin-client.tsx"
];

function read(path) {
  return readFileSync(path, "utf8");
}

const component = read(componentPath);

if (!component.includes('href="/ask"')) {
  throw new Error("AdminViewCommunityLink must point to /ask.");
}

if (!component.includes('target="_blank"')) {
  throw new Error("AdminViewCommunityLink must open in a new tab.");
}

if (!component.includes('rel="noreferrer"')) {
  throw new Error("AdminViewCommunityLink must avoid leaking referrer data.");
}

for (const file of adminFiles) {
  const source = read(file);
  if (!source.includes("AdminViewCommunityLink")) {
    throw new Error(`${file} must render AdminViewCommunityLink.`);
  }
}

console.log("Admin view community link checks passed.");
