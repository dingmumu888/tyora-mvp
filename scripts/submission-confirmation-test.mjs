import fs from "node:fs";

const source = fs.readFileSync("app/source/source-client.tsx", "utf8");
const idea = fs.readFileSync("app/ask/new/new-idea-client.tsx", "utf8");
const failures = [];

[
  "Request received",
  "Request ID",
  "within 1 business day",
  "Saved contact",
  "Submit another product",
  "Back to TYORA"
].forEach((text) => {
  if (!source.includes(text)) failures.push(`Source receipt missing: ${text}`);
});

if (!idea.includes('visibility: "Public"') || !idea.includes("window.location.href = `/ask/${payload.data.slug}`")) {
  failures.push("Public idea submissions should retain the public intent and open the author's review page.");
}

if (!idea.includes("Your idea is ready for TYORA review.") || !idea.includes("only after TYORA approves it")) {
  failures.push("Public idea submissions must explain moderation before public visibility.");
}

if (idea.includes("Private custom request received") || idea.includes('form.visibility === "Private"')) {
  failures.push("The public idea form still contains a private custom submission path.");
}

if (failures.length) {
  console.error("Submission confirmation checks failed:");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log("Submission confirmation checks passed.");
