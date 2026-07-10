import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const source = fs.readFileSync(path.join(root, "app/admin/community/community-admin-client.tsx"), "utf8");

const checks = [
  {
    label: "admin community normalizes loaded ideas before rendering",
    pass:
      source.includes("function normalizeCommunityIdea") &&
      source.includes("setIdeas((payload.data || []).map(normalizeCommunityIdea))")
  },
  {
    label: "admin community normalizes saved reply response before replacing local state",
    pass: source.includes("const updated = normalizeCommunityIdea(payload.data)")
  },
  {
    label: "admin community gives comments and counts safe defaults",
    pass:
      source.includes("comments: Array.isArray(idea?.comments) ? idea.comments : []") &&
      source.includes("likeCount: Number(idea?.likeCount || 0)") &&
      source.includes("interestedCount: Number(idea?.interestedCount || 0)")
  }
];

const failed = checks.filter((check) => !check.pass);

if (failed.length > 0) {
  console.error("Admin community reply client checks failed:");
  for (const check of failed) console.error(`- ${check.label}`);
  process.exit(1);
}

console.log("Admin community reply client checks passed.");
