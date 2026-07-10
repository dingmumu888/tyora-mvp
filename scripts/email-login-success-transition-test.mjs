import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const componentPath = path.join(root, "components", "email-login.tsx");
const source = fs.readFileSync(componentPath, "utf8");

const checks = [
  {
    name: "success screen tells the user My TYORA is opening",
    pass: source.includes("Opening My TYORA")
  },
  {
    name: "success screen uses a loading spinner while redirecting",
    pass: /step === "success"[\s\S]*Loader2[\s\S]*animate-spin/.test(source)
  },
  {
    name: "verify success switches to the success step before refresh",
    pass: /setStep\("success"\)[\s\S]*router\.refresh\(\)/.test(source)
  },
  {
    name: "modal cannot be closed while the success redirect is shown",
    pass: source.includes('if (busy || step === "success") return;')
  }
];

const failures = checks.filter((check) => !check.pass);

if (failures.length) {
  console.error("Email login success transition checks failed:");
  for (const failure of failures) console.error(`- ${failure.name}`);
  process.exit(1);
}

console.log("Email login success transition checks passed.");
