import { readFileSync } from "node:fs";

const page = readFileSync("app/ask/[slug]/page.tsx", "utf8");
const actions = readFileSync("app/ask/[slug]/idea-actions.tsx", "utf8");

const checks = [
  {
    name: "ready action waits invisibly and only renders for the idea owner",
    pass:
      actions.includes('if (mode === "ready")') &&
      actions.includes("if (!sessionChecked || !isOwner) return null;")
  },
  {
    name: "owner continuation uses compact project copy without the old public card",
    pass:
      actions.includes("Continue your project") &&
      actions.includes("Continue with TYORA") &&
      !actions.includes("Ready to build?") &&
      !actions.includes("Email Login to Continue")
  },
  {
    name: "existing WhatsApp project handoff details remain intact",
    pass:
      actions.includes("Idea ID:") &&
      actions.includes("Idea URL:") &&
      actions.includes("Title:") &&
      actions.includes("Customer Name:")
  },
  {
    name: "public idea detail removes repeated Live Activity content",
    pass:
      !page.includes("Live Activity") &&
      !page.includes("started this discussion") &&
      !page.includes("community comments.")
  },
  {
    name: "discussion and reaction controls remain available",
    pass:
      page.includes('<IdeaComments slug={idea.slug}') &&
      page.includes('<IdeaActions idea={idea} mode="comment" />') &&
      actions.includes('react("Like")') &&
      actions.includes('react("Interested")')
  }
];

const failed = checks.filter((check) => !check.pass);

if (failed.length > 0) {
  console.error("Idea detail owner CTA checks failed:");
  for (const check of failed) console.error(`- ${check.name}`);
  process.exit(1);
}

console.log("Idea detail owner CTA checks passed.");
