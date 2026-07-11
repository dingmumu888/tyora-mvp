import { readFileSync } from "node:fs";

const page = readFileSync("app/ask/[slug]/page.tsx", "utf8");
const gallery = readFileSync("app/ask/[slug]/idea-image-gallery.tsx", "utf8");
const comments = readFileSync("app/ask/[slug]/idea-comments.tsx", "utf8");
const actions = readFileSync("app/ask/[slug]/idea-actions.tsx", "utf8");

const checks = [
  {
    name: "detail page uses the compact image gallery",
    pass: page.includes("<IdeaImageGallery") && gallery.includes("previewImages") && gallery.includes("imageUrls.slice(0, 3)")
  },
  {
    name: "image gallery exposes total image count and full-screen viewer",
    pass: gallery.includes("+{extraCount}") && gallery.includes("fixed inset-0") && gallery.includes("{activeIndex + 1} / {imageUrls.length}")
  },
  {
    name: "detail page removes heavy project archive sections",
    pass: !page.includes("Project Timeline") && !page.includes("Files") && !page.includes("Current Status") && !page.includes("Manufacturing Scope")
  },
  {
    name: "comments default to five with a view-more control",
    pass: comments.includes("visibleComments") && comments.includes("topLevelComments.slice(0, 5)") && comments.includes("View more comments")
  },
  {
    name: "actions are split into bar, comment form, and ready CTA",
    pass: actions.includes('mode = "bar"') && page.includes('mode="bar"') && page.includes('mode="comment"') && page.includes('mode="ready"')
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
