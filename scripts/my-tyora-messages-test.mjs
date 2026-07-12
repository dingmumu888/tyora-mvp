import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const myTyoraPath = path.join(root, "app/me/page.tsx");
const messagesPath = path.join(root, "app/me/activity-messages.tsx");
const summaryPath = path.join(root, "app/me/activity-summary.tsx");
const userMenuPath = path.join(root, "components/community-user-menu.tsx");
const mobileTabsPath = path.join(root, "components/mobile-bottom-tabs.tsx");

const myTyora = fs.readFileSync(myTyoraPath, "utf8");
const messages = fs.existsSync(messagesPath) ? fs.readFileSync(messagesPath, "utf8") : "";
const summary = fs.existsSync(summaryPath) ? fs.readFileSync(summaryPath, "utf8") : "";
const userMenu = fs.existsSync(userMenuPath) ? fs.readFileSync(userMenuPath, "utf8") : "";
const mobileTabs = fs.existsSync(mobileTabsPath) ? fs.readFileSync(mobileTabsPath, "utf8") : "";

const checks = [
  {
    label: "Profile stats open activity panels instead of linking to page sections",
    pass:
      myTyora.includes("<ActivitySummary") &&
      summary.includes("setActiveView(view)") &&
      summary.includes("type ActivityView = \"posts\" | \"comments\" | \"likes\" | \"interested\" | \"reviews\"")
  },
  {
    label: "My TYORA keeps the profile card compact and removes expanded activity sections",
    pass:
      myTyora.includes("<ActivityMessages") &&
      !myTyora.includes('id="discussions"') &&
      !myTyora.includes('id="comments"') &&
      !myTyora.includes('id="liked"') &&
      !myTyora.includes("topNotificationCards") &&
      !myTyora.includes("Activity inbox")
  },
  {
    label: "Activity panel images render fully instead of cropped",
    pass:
      summary.includes("object-contain") &&
      !summary.includes("object-cover")
  },
  {
    label: "Posts panel supports editing and deleting own posts",
    pass:
      summary.includes("Edit") &&
      summary.includes("Delete") &&
      summary.includes("method: \"PATCH\"") &&
      summary.includes("method: \"DELETE\"")
  },
  {
    label: "Posts panel stays open after editing or deleting a post",
    pass:
      summary.includes("const [localIdeas, setLocalIdeas] = useState(ideas)") &&
      summary.includes("setLocalIdeas((currentIdeas)") &&
      summary.includes("setEditingIdea(null)") &&
      !summary.includes("window.location.reload();")
  },
  {
    label: "Likes panel supports canceling likes through reaction toggle",
    pass:
      summary.includes("Cancel like") &&
      summary.includes("body: JSON.stringify({ type: \"Like\" })")
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
  },
  {
    label: "Profile avatar links do not mark notifications read before the Messages panel is visible",
    pass:
      !userMenu.includes("onClick={() => void markNotificationsRead()}") &&
      !mobileTabs.includes("onClick={() => void markNotificationsRead()}") &&
      !userMenu.includes("async function markNotificationsRead()")
  },
  {
    label: "Mobile profile notification count is anchored on the avatar instead of floating after it",
    pass:
      mobileTabs.includes('className="relative"') &&
      mobileTabs.includes("<CommunityAvatar") &&
      mobileTabs.includes("{notificationLabel}") &&
      !mobileTabs.includes("absolute right-3 top-1")
  },
  {
    label: "Messages button keeps unread count visible on My TYORA",
    pass:
      messages.includes("unreadText(localUnreadCount)") &&
      messages.includes("bg-[#ff385c]") &&
      messages.includes("{unread}")
  },
  {
    label: "Opening Messages marks notifications read and clears every badge",
    pass:
      messages.includes('fetch("/api/community/notifications/read", { method: "POST" })') &&
      messages.includes("setLocalUnreadCount(0)") &&
      messages.includes('window.dispatchEvent(new CustomEvent("tyora:community-notifications-read"))') &&
      messages.includes("onClick={() => void openMessages()}")
  }
];

const failed = checks.filter((check) => !check.pass);
if (failed.length) {
  console.error("My TYORA messages checks failed:");
  for (const check of failed) console.error(`- ${check.label}`);
  process.exit(1);
}

console.log("My TYORA messages checks passed.");
