import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const myTyoraPath = path.join(root, "app/me/page.tsx");
const messagesPath = path.join(root, "app/me/activity-messages.tsx");

const myTyora = fs.readFileSync(myTyoraPath, "utf8");
const messages = fs.existsSync(messagesPath) ? fs.readFileSync(messagesPath, "utf8") : "";

const checks = [
  {
    label: "Profile stats are clickable links into their matching sections",
    pass:
      myTyora.includes("compactStats.map(({ label, value, href })") &&
      myTyora.includes("<Link key={label} href={href}")
  },
  {
    label: "My TYORA uses one compact Messages entry instead of expanded inbox cards",
    pass:
      myTyora.includes("<ActivityMessages") &&
      !myTyora.includes("topNotificationCards") &&
      !myTyora.includes("Activity inbox")
  },
  {
    label: "Messages panel groups comments, likes, interested, and TYORA reviews",
    pass:
      messages.includes('type ActivityFilter = "all" | "comment" | "like" | "interested" | "review"') &&
      messages.includes("filters.map") &&
      messages.includes("Write a reply")
  },
  {
    label: "Messages panel can reply through the existing community comments API",
    pass:
      messages.includes("fetch(`/api/community/ideas/${slug}/comments`") &&
      messages.includes("parentId: activeReply.parentId")
  }
];

const failed = checks.filter((check) => !check.pass);
if (failed.length) {
  console.error("My TYORA messages checks failed:");
  for (const check of failed) console.error(`- ${check.label}`);
  process.exit(1);
}

console.log("My TYORA messages checks passed.");
