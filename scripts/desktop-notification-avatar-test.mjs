import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const menu = fs.readFileSync(path.join(root, "components/community-user-menu.tsx"), "utf8");
const home = fs.readFileSync(path.join(root, "app/home-client.tsx"), "utf8");
const ask = fs.readFileSync(path.join(root, "app/ask/page.tsx"), "utf8");

const checks = [
  {
    label: "desktop user menu tracks notification count and shows avatar red dot",
    pass:
      menu.includes("notificationCount") &&
      menu.includes("setNotificationCount") &&
      menu.includes("rounded-full bg-[#ff385c]") &&
      menu.includes("aria-label=\"Unread messages\"")
  },
  {
    label: "clicking avatar opens My TYORA and marks notifications read",
    pass:
      menu.includes("href=\"/me\"") &&
      menu.includes("markNotificationsRead") &&
      menu.includes("/api/community/notifications/read") &&
      !menu.includes("setMenuOpen((value) => !value)")
  },
  {
    label: "desktop header removes standalone notification bell links",
    pass:
      !home.includes('href="/me#notifications"') &&
      !ask.includes('href="/me#notifications"')
  }
];

const failed = checks.filter((check) => !check.pass);

if (failed.length > 0) {
  console.error("Desktop notification avatar checks failed:");
  for (const check of failed) console.error(`- ${check.label}`);
  process.exit(1);
}

console.log("Desktop notification avatar checks passed.");
