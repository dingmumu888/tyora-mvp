import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const admin = read("app/admin/page.tsx");
const queue = read("app/admin/work-orders/work-orders-admin-client.tsx");
const failures = [];

if (!admin.includes('label: "Workbench"')) failures.push("Admin navigation is missing Workbench.");
if (admin.includes('label: "Work Orders"')) failures.push("Admin still has a separate Work Orders sidebar item.");
if (!admin.includes('label: "Customers"')) failures.push("Admin navigation is missing Customers.");
if (!admin.includes('/api/admin/customers')) failures.push("Admin does not load the customer list.");
for (const filter of ['"Replied"', '"Community"', '"Source"', '"Projects"']) {
  if (!queue.includes(filter)) failures.push(`Workbench queue is missing ${filter} filter.`);
}
if (!queue.includes("bg-[#eff6ff]") || !queue.includes("bg-[#f5f3ff]")) failures.push("Community and Source labels are not visually distinct.");
if (!queue.includes("Unique visitors") || !queue.includes("Page views")) failures.push("Workbench is missing visitor metrics.");

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}
console.log("Admin workbench V1 contract passed.");
