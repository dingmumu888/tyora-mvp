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

[
  "Private custom request received",
  "Request ID",
  "Open My TYORA",
  "Submit another request",
  'form.visibility === "Private"',
  "setPublishedIdea"
  ,"setOneSentence(\"\")"
  ,"setImagePreviews([])"
].forEach((text) => {
  if (!idea.includes(text)) failures.push(`Private Custom receipt missing: ${text}`);
});

if (!idea.includes('if (form.visibility === "Private") return;') || !idea.includes("window.location.href = `/ask/${payload.data.slug}`")) {
  failures.push("Private submissions should stop on confirmation while public submissions keep redirecting.");
}

if (failures.length) {
  console.error("Submission confirmation checks failed:");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log("Submission confirmation checks passed.");
