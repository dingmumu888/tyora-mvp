import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

const desktopAvatarPages = [
  "app/source/source-client.tsx",
  "app/source/how-it-works/page.tsx",
  "app/build/build-client.tsx",
  "app/ask/[slug]/page.tsx",
  "app/me/page.tsx",
  "app/privacy-policy/page.tsx",
  "app/terms/page.tsx"
];

const failures = [];

for (const file of desktopAvatarPages) {
  const source = fs.readFileSync(path.join(root, file), "utf8");
  if (!source.includes("CommunityUserMenu")) {
    failures.push(`${file} does not include CommunityUserMenu`);
  }
  if (!source.includes('className="hidden md:block"')) {
    failures.push(`${file} does not hide the avatar entry on mobile`);
  }
}

if (failures.length > 0) {
  console.error("Desktop avatar header checks failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Desktop avatar header checks passed.");
