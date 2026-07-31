import { readFileSync } from "node:fs";

const page = readFileSync("app/ask/[slug]/page.tsx", "utf8");
const gallery = readFileSync("app/ask/[slug]/idea-image-gallery.tsx", "utf8");
const comments = readFileSync("app/ask/[slug]/idea-comments.tsx", "utf8");
const actions = readFileSync("app/ask/[slug]/idea-actions.tsx", "utf8");

const checks = [
  {
    name: "detail page uses a nine-image adaptive gallery",
    pass: page.includes("<IdeaImageGallery") && gallery.includes("imageUrls.slice(0, 9)") && gallery.includes("grid-cols-3")
  },
  {
    name: "image gallery supports full-screen, keyboard and touch browsing",
    pass:
      gallery.includes("fixed inset-0") &&
      gallery.includes('event.key === "ArrowLeft"') &&
      gallery.includes('event.key === "ArrowRight"') &&
      gallery.includes("onTouchStart") &&
      gallery.includes("onTouchEnd")
  },
  {
    name: "post hierarchy places gallery before description and actions",
    pass:
      page.indexOf("<IdeaImageGallery") < page.indexOf("{idea.description}") &&
      page.indexOf("{idea.description}") < page.indexOf("<IdeaActions")
  },
  {
    name: "detail page removes heavy project archive sections",
    pass: !page.includes("Project Timeline") && !page.includes("Files") && !page.includes("Current Status") && !page.includes("Manufacturing Scope")
  },
  {
    name: "comments default to five with sorting and a localized view-more control",
    pass:
      comments.includes("visibleComments") &&
      comments.includes("sortedComments.slice(0, 5)") &&
      comments.includes('setSort(value)') &&
      comments.includes('t("viewMore")')
  },
  {
    name: "TYORA assessment is pinned inside the discussion stream",
    pass:
      !page.includes('id="tyora-expert-review"') &&
      page.includes("<IdeaComments") &&
      comments.includes('t("tyoraTeam")') &&
      comments.includes('t("pinned")')
  },
  {
    name: "action bar includes helpful, interest, comment and share controls",
    pass:
      actions.includes('react("Helpful")') &&
      actions.includes('react("Interested")') &&
      actions.includes('idea.comments.length') &&
      actions.includes("setShareOpen(true)")
  },
  {
    name: "idea actions wait for community session before showing email login gates",
    pass:
      actions.includes("sessionChecked") &&
      actions.includes("setSessionChecked(true)") &&
      actions.includes("!sessionChecked") &&
      comments.includes("sessionChecked") &&
      comments.includes("setSessionChecked(true)") &&
      comments.includes("!sessionChecked")
  }
];

const failed = checks.filter((check) => !check.pass);

if (failed.length > 0) {
  console.error("Idea detail community layout checks failed:");
  for (const check of failed) console.error(`- ${check.name}`);
  process.exit(1);
}

console.log("Idea detail community layout checks passed.");
