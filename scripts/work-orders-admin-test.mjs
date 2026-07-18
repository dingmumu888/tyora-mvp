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
    "getAllCustomInquiriesAdmin",
    "getSourceRequests",
    "getLeads",
    "visibility === \"Private\"",
    "? \"Custom\" : \"Idea\"",
    "type: \"Source\"",
    "type: \"Project\"",
    "needsReply"
    ,"hasReview"
    ,"hasInternalNotes"
  ].forEach((text) => {
    if (!store.includes(text)) failures.push(`Work order store missing: ${text}`);
  });
}

if (exists("app", "api", "admin", "work-orders", "route.ts")) {
  const route = read("app", "api", "admin", "work-orders", "route.ts");
  ["requireAdminSession", "getWorkOrders", "updateWorkOrder", "export async function PATCH", "ok("].forEach((text) => {
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
    "Search product, customer, country, or ID",
    "WhatsApp",
    "Email",
    "internalNotes",
    "customerVisibleUpdate",
    "PATCH",
    "Status",
    "Internal notes",
    "Customer-visible update",
    "Save changes",
    "Record customer contact",
    "Channel",
    "Contacted at",
    "Next follow-up",
    "Add contact record",
    "Activity timeline",
    "Structured TYORA assessment",
    "Documents and private files",
    "role=\"dialog\"",
    "xl:grid-cols-[minmax(0,1fr)_420px]",
    "fixed inset-0 z-50 xl:hidden",
    "activeSection=\"inbox\"",
    "object-contain"
  ].forEach((text) => {
    if (!client.includes(text)) failures.push(`Work orders client missing: ${text}`);
  });

  if (client.includes("object-cover")) {
    failures.push("Work order thumbnails should not crop uploaded product images with object-cover.");
  }

  if (client.includes("Open original")) {
    failures.push("Work order primary action should describe the reply/follow-up action, not say Open original.");
  }
}

const shell = read("components", "admin", "admin-shell.tsx");
if (!shell.includes('label: "Inbox"') || !shell.includes('href: "/admin/work-orders"') || !shell.includes('sectionId: "inbox"')) {
  failures.push("Admin shell does not expose the unified Inbox route.");
}

if (failures.length) {
  console.error("Work orders admin checks failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Work orders admin checks passed.");
