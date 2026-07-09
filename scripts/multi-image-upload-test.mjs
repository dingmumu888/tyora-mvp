import { readFileSync } from "node:fs";

const source = readFileSync("app/ask/new/new-idea-client.tsx", "utf8");

const checks = [
  {
    name: "file inputs accept mobile gallery images",
    pass: (source.match(/accept="image\/\*"/g) || []).length >= 2
  },
  {
    name: "file inputs keep multi-select enabled",
    pass: (source.match(/type="file"\s+accept="image\/\*"\s+multiple/g) || []).length >= 2
  },
  {
    name: "file input is reset after selection",
    pass: source.includes('event.currentTarget.value = ""')
  },
  {
    name: "upload copy tells mobile users they can select up to five at once",
    pass: source.includes("Select up to 5 images at once")
  }
];

const failed = checks.filter((check) => !check.pass);

if (failed.length > 0) {
  console.error("Multi-image upload checks failed:");
  for (const check of failed) {
    console.error(`- ${check.name}`);
  }
  process.exit(1);
}

console.log("Multi-image upload checks passed.");
