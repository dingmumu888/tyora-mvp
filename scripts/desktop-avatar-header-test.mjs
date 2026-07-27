import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

const desktopAvatarPages = [
  "app/source/source-client.tsx",
  "app/source/how-it-works/page.tsx",
  "app/build/build-client.tsx",
  "app/ask/[slug]/page.tsx",
  "app/me/page.tsx"
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

const legalShell = fs.readFileSync(path.join(root, "components/legal-page-shell.tsx"), "utf8");
if (!legalShell.includes("CommunityUserMenu")) {
  failures.push("components/legal-page-shell.tsx does not include CommunityUserMenu");
}
if (!legalShell.includes('className="hidden md:block"')) {
  failures.push("components/legal-page-shell.tsx does not hide the avatar entry on mobile");
}

for (const file of ["app/privacy-policy/page.tsx", "app/terms/page.tsx", "app/service-scope/page.tsx"]) {
  const source = fs.readFileSync(path.join(root, file), "utf8");
  if (!source.includes("LegalPageShell")) {
    failures.push(`${file} does not use the shared legal page shell`);
  }
}

if (failures.length > 0) {
  console.error("Desktop avatar header checks failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Desktop avatar header checks passed.");
