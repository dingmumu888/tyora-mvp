import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

function read(...parts) {
  return fs.readFileSync(path.join(root, ...parts), "utf8");
}

function exists(...parts) {
  return fs.existsSync(path.join(root, ...parts));
}

const failures = [];

[
  ["lib", "work-orders.ts"],
  ["lib", "server", "work-order-store.ts"],
  ["app", "api", "admin", "work-orders", "route.ts"],
  ["app", "admin", "work-orders", "page.tsx"],
  ["app", "admin", "work-orders", "work-orders-admin-client.tsx"]
].forEach((parts) => {
  if (!exists(...parts)) failures.push(`Missing ${parts.join("/")}`);
});

if (exists("lib", "work-orders.ts")) {
  const workOrders = read("lib", "work-orders.ts");
  [
    "export type WorkOrderType",
    "\"Idea\"",
    "\"Custom\"",
    "\"Source\"",
    "\"Project\"",
    "export type WorkOrderStatus",
    "\"Needs Reply\"",
    "\"Reviewing\"",
    "\"Quoted\"",
    "\"Sample\"",
    "\"Factory Introduced\"",
    "\"Managed\"",
    "\"Production\"",
    "\"Shipping\"",
    "\"Completed\"",
    "\"Closed\""
  ].forEach((text) => {
    if (!workOrders.includes(text)) failures.push(`Work order type/status missing: ${text}`);
  });
}

if (exists("lib", "server", "work-order-store.ts")) {
  const store = read("lib", "server", "work-order-store.ts");
  [
    "getCommunityIdeas",
    "getSourceRequests",
    "getLeads",
    "visibility === \"Private\"",
    "? \"Custom\" : \"Idea\"",
    "type: \"Source\"",
    "type: \"Project\"",
    "needsReply"
  ].forEach((text) => {
    if (!store.includes(text)) failures.push(`Work order store missing: ${text}`);
  });
}

if (exists("app", "api", "admin", "work-orders", "route.ts")) {
  const route = read("app", "api", "admin", "work-orders", "route.ts");
  ["requireAdminSession", "getWorkOrders", "ok("].forEach((text) => {
    if (!route.includes(text)) failures.push(`Work orders API missing: ${text}`);
  });
}

if (exists("app", "admin", "work-orders", "work-orders-admin-client.tsx")) {
  const client = read("app", "admin", "work-orders", "work-orders-admin-client.tsx");
  [
    "/api/admin/work-orders",
    "Needs Reply",
    "Source",
    "Custom",
    "Project",
    "Search product, customer, country, ID",
    "Open original",
    "WhatsApp",
    "Email",
    "internalNotes",
    "slice(0, 9)",
    "grid-cols-3",
    "more images"
  ].forEach((text) => {
    if (!client.includes(text)) failures.push(`Work orders client missing: ${text}`);
  });
}

const admin = read("app", "admin", "page.tsx");
if (!admin.includes("href: \"/admin/work-orders\"")) {
  failures.push("Admin navigation does not link Work Orders.");
}
if (admin.includes("{ href: \"/admin/community\", label: \"Ideas\" }") && admin.includes("{ href: \"/admin/source\", label: \"Source Products\" }")) {
  failures.push("Admin primary navigation still exposes separate Ideas and Source Products entries.");
}

if (failures.length) {
  console.error("Work orders admin checks failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Work orders admin checks passed.");
