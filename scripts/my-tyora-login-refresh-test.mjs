import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const emailLoginPath = path.join(root, "components/email-login.tsx");
const myTyoraPath = path.join(root, "app/me/page.tsx");

const emailLogin = fs.readFileSync(emailLoginPath, "utf8");
const myTyora = fs.readFileSync(myTyoraPath, "utf8");

const checks = [
  {
    label: "EmailLogin supports refreshing server-rendered pages after successful login",
    pass:
      emailLogin.includes("refreshOnSuccess") &&
      emailLogin.includes("useRouter") &&
      emailLogin.includes("router.refresh()")
  },
  {
    label: "My TYORA login prompt opts into post-login server refresh",
    pass: myTyora.includes("<EmailLogin") && myTyora.includes("refreshOnSuccess")
  }
];

const failed = checks.filter((check) => !check.pass);
if (failed.length) {
  console.error("My TYORA login refresh checks failed:");
  for (const check of failed) console.error(`- ${check.label}`);
  process.exit(1);
}

console.log("My TYORA login refresh checks passed.");
