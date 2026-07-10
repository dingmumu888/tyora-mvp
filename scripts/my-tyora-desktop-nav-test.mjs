import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const pagePath = path.join(root, "app", "me", "page.tsx");
const source = fs.readFileSync(pagePath, "utf8");

const navItems = [
  { label: "Home", href: "/" },
  { label: "Source", href: "/source" },
  { label: "Hot", href: "/" },
  { label: "Custom", href: "/custom" },
  { label: "Community", href: "/ask" }
];

const failures = [];

if (!source.includes("const myTyoraDesktopNav")) {
  failures.push("My TYORA page should define shared desktop navigation items.");
}

for (const item of navItems) {
  if (!source.includes(`label: "${item.label}"`) || !source.includes(`href: "${item.href}"`)) {
    failures.push(`Missing desktop nav item ${item.label} -> ${item.href}.`);
  }
}

if (!/hidden\s+items-center[\s\S]*myTyoraDesktopNav\.map/.test(source)) {
  failures.push("Desktop header should render the shared navigation list.");
}

if (!/Log in to view My TYORA[\s\S]*myTyoraDesktopNav\.map/.test(source)) {
  failures.push("Logged-out My TYORA page should also render the navigation list.");
}

if (failures.length) {
  console.error("My TYORA desktop navigation checks failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("My TYORA desktop navigation checks passed.");
