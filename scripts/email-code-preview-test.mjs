import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const source = fs.readFileSync(path.join(root, "lib/email/verification.ts"), "utf8");

const checks = [
  {
    label: "email subject puts the login code in the inbox list",
    pass: source.includes("const subject = `TYORA code: ${code}`")
  },
  {
    label: "email preheader starts with the login code for preview snippets",
    pass: source.includes("const preheader = `Your TYORA login code is ${code}.")
  },
  {
    label: "plain text email starts with the code before brand copy",
    pass:
      source.includes("`Your TYORA login code is ${code}.`") &&
      source.indexOf("`Your TYORA login code is ${code}.`") < source.indexOf("\"TYORA\",")
  }
];

const failed = checks.filter((check) => !check.pass);

if (failed.length > 0) {
  console.error("Email code preview checks failed:");
  for (const check of failed) console.error(`- ${check.label}`);
  process.exit(1);
}

console.log("Email code preview checks passed.");
