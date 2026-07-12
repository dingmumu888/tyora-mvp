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
    "Search product, customer, country, ID",
    "workOrderActionLabel",
    "Reply / Quote",
    "Reply to idea",
    "Review custom request",
    "Follow up project",
    "WhatsApp",
    "Email",
    "internalNotes",
    "saveWorkOrder",
    "PATCH",
    "Status",
    "TYORA reply",
    "Internal notes",
    "Save changes",
    "Handle work order",
    "Record customer contact",
    "Contact channel",
    "Contacted at",
    "Next follow-up",
    "Add contact record",
    "Latest contact",
    "event.nextFollowUpAt",
    "order.contactHistory.map",
    "Expand work order",
    "<details",
    "<summary",
    "useEffect(() =>",
    "slice(0, 9)",
    "grid-cols-3",
    "grid-cols-1",
    "grid-cols-2",
    "imageGridClass",
    "more images",
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

const admin = read("app", "admin", "page.tsx");
if (!admin.includes('label: "Workbench"') || !admin.includes("<WorkOrdersAdminClient embedded />")) {
  failures.push("Admin navigation does not expose the unified Workbench queue.");
}
if (admin.includes('label: "Work Orders"')) {
  failures.push("Admin navigation still exposes Work Orders separately from Workbench.");
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
