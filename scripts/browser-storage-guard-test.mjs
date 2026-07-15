import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const analytics = fs.readFileSync(path.join(root, "lib/analytics.ts"), "utf8");
const homeClient = fs.readFileSync(path.join(root, "app/home-client.tsx"), "utf8");
const profileGate = fs.readFileSync(path.join(root, "components/community-profile-gate.tsx"), "utf8");

const checks = [
  {
    label: "analytics wraps browser storage reads and writes",
    pass:
      analytics.includes("function storageGet") &&
      analytics.includes("function storageSet") &&
      analytics.includes("try {") &&
      analytics.includes("catch {") &&
      !analytics.includes("localStorage.getItem") &&
      !analytics.includes("localStorage.setItem") &&
      !analytics.includes("sessionStorage.getItem") &&
      !analytics.includes("sessionStorage.setItem")
  },
  {
    label: "home page does not use unguarded browser storage",
    pass:
      (!homeClient.includes("sessionStorage") && !homeClient.includes("localStorage")) ||
      (homeClient.includes("try {") && homeClient.includes("catch"))
  },
  {
    label: "community profile gate storage is guarded for blocked site data",
    pass:
      profileGate.includes("safeSessionGet") &&
      profileGate.includes("safeSessionSet") &&
      profileGate.includes("return safeSessionGet(skippedKey(userId))") &&
      profileGate.includes('safeSessionSet(skippedKey(userId), "true")')
  }
];

const failed = checks.filter((check) => !check.pass);

if (failed.length > 0) {
  console.error("Browser storage guard checks failed:");
  for (const check of failed) console.error(`- ${check.label}`);
  process.exit(1);
}

console.log("Browser storage guard checks passed.");
