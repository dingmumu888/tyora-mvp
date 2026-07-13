import { existsSync, readFileSync } from "node:fs";

const actions = readFileSync("app/ask/[slug]/idea-actions.tsx", "utf8");
const panelPath = "app/ask/[slug]/idea-share-panel.tsx";
const panel = existsSync(panelPath) ? readFileSync(panelPath, "utf8") : "";
const analytics = readFileSync("lib/analytics.ts", "utf8");

const checks = [
  {
    name: "both detail share buttons open the reusable share panel",
    pass:
      actions.includes("IdeaSharePanel") &&
      (actions.match(/setShareOpen\(true\)/g) || []).length === 2 &&
      !actions.includes("navigator.share?.")
  },
  {
    name: "share panel offers the agreed platform choices",
    pass: ["Facebook", "X", "LinkedIn", "WhatsApp", "Copy link", "More apps"].every((label) => panel.includes(label))
  },
  {
    name: "share panel uses supported platform composer URLs",
    pass:
      panel.includes("facebook.com/sharer/sharer.php") &&
      panel.includes("twitter.com/intent/tweet") &&
      panel.includes("linkedin.com/sharing/share-offsite") &&
      panel.includes("wa.me/?text=")
  },
  {
    name: "share panel supports clipboard and native share fallbacks",
    pass:
      panel.includes("navigator.clipboard.writeText") &&
      panel.includes("navigator.share") &&
      panel.includes("Instagram")
  },
  {
    name: "share panel is dismissible with Escape and an explicit dialog close",
    pass:
      panel.includes('event.key === "Escape"') &&
      panel.includes('role="dialog"') &&
      panel.includes('aria-label="Close share options"')
  },
  {
    name: "share panel manages initial focus, traps Tab, and restores prior focus",
    pass:
      panel.includes("dialogRef") &&
      panel.includes("closeButtonRef") &&
      panel.includes("previousFocus") &&
      (panel.includes('event.key === "Tab"') || panel.includes('event.key !== "Tab"')) &&
      panel.includes("focusableElements")
  },
  {
    name: "legacy copy cleanup and native cancellation are defensive",
    pass:
      panel.includes("finally") &&
      panel.includes("input.remove()") &&
      panel.includes("isShareCancellation")
  },
  {
    name: "share attempts are tracked with the idea_share analytics event",
    pass: analytics.includes('"idea_share"') && panel.includes('trackAnalyticsEvent("idea_share"')
  }
];

const failed = checks.filter((check) => !check.pass);
if (failed.length) {
  console.error("Idea share panel checks failed:");
  for (const check of failed) console.error(`- ${check.name}`);
  process.exit(1);
}

console.log("Idea share panel checks passed.");
