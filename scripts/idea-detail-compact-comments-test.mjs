import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const files = {
  page: fs.readFileSync(path.join(root, "app/ask/[slug]/page.tsx"), "utf8"),
  actions: fs.readFileSync(path.join(root, "app/ask/[slug]/idea-actions.tsx"), "utf8"),
  comments: fs.readFileSync(path.join(root, "app/ask/[slug]/idea-comments.tsx"), "utf8"),
  store: fs.readFileSync(path.join(root, "lib/server/community-store.ts"), "utf8"),
  commentRoute: fs.readFileSync(path.join(root, "app/api/community/ideas/[slug]/comments/[commentId]/route.ts"), "utf8"),
  types: fs.readFileSync(path.join(root, "lib/community.ts"), "utf8")
};

const checks = [
  {
    label: "idea metadata is compact and omits Not specified",
    pass:
      files.page.includes("compactMeta") &&
      files.page.includes('filter((item) => item.value && item.value !== "Not specified")') &&
      !files.page.includes("{idea.questions.slice(0, 3).map")
  },
  {
    label: "TYORA Expert Review card uses compact accent styling",
    pass:
      files.page.includes("border-[#99f6e4]") &&
      files.page.includes("text-[#0f766e]") &&
      files.page.includes("p-3 text-sm leading-6")
  },
  {
    label: "idea actions render as one compact stats bar with counts",
    pass:
      files.actions.includes('mode?: IdeaActionMode; compact?: boolean') &&
      files.actions.includes("compact-action-bar") &&
      files.actions.includes("{idea.likeCount}") &&
      files.actions.includes("{idea.interestedCount}") &&
      files.page.includes('<IdeaActions idea={idea} mode="bar" compact />')
  },
  {
    label: "comment replies post with parentId and show reply context",
    pass:
      files.comments.includes("replyingTo") &&
      files.comments.includes("parentId: replyingTo.parentId || replyingTo.id") &&
      files.comments.includes("Replying to") &&
      files.comments.includes("topLevelComments") &&
      files.comments.includes("repliesByParent")
  },
  {
    label: "comment likes have a backend store helper and route PATCH",
    pass:
      files.store.includes("export async function toggleCommunityCommentReaction") &&
      files.commentRoute.includes("toggleCommunityCommentReaction") &&
      files.commentRoute.includes("export async function PATCH")
  },
  {
    label: "comment type exposes viewerLiked for comment like state",
    pass:
      files.types.includes("viewerLiked?: boolean") &&
      files.store.includes("viewerLiked:")
  }
];

const failed = checks.filter((check) => !check.pass);
if (failed.length) {
  console.error("Idea detail compact comments checks failed:");
  for (const check of failed) console.error(`- ${check.label}`);
  process.exit(1);
}

console.log("Idea detail compact comments checks passed.");
