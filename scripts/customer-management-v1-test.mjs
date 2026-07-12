import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const schema = read("prisma/schema.prisma");
const verify = read("app/api/community/auth/email/verify/route.ts");
const adminRoutePath = path.join(root, "app/api/admin/customers/route.ts");
const customerStorePath = path.join(root, "lib/server/customer-store.ts");
const failures = [];

for (const field of ["lastLoginAt", "loginCount", "firstTrafficSource", "lastCity", "lastIpHash", "lastMaskedIp"]) {
  if (!schema.includes(field)) failures.push(`CommunityUser is missing ${field}.`);
}
if (!verify.includes("recordCommunityUserLogin") || !verify.includes("catch")) failures.push("Email verification does not record login metadata safely.");
if (!fs.existsSync(customerStorePath)) failures.push("Customer store is missing.");
if (!fs.existsSync(adminRoutePath)) failures.push("Admin customer API is missing.");
if (fs.existsSync(customerStorePath)) {
  const customerStore = read("lib/server/customer-store.ts");
  for (const relation of ["ideas", "comments", "reactions"]) {
    if (!customerStore.includes(relation)) failures.push(`Customer list does not include ${relation} counts.`);
  }
}
if (fs.existsSync(adminRoutePath) && !read("app/api/admin/customers/route.ts").includes("requireAdminSession")) {
  failures.push("Customer API is not admin protected.");
}

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}
console.log("Customer management V1 contract passed.");

