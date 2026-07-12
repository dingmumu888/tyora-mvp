import fs from "node:fs";

const read = (path) => fs.readFileSync(path, "utf8");
const schema = read("prisma/schema.prisma");
const types = read("lib/work-orders.ts");
const store = fs.existsSync("lib/server/work-order-contact-store.ts") ? read("lib/server/work-order-contact-store.ts") : "";
const workOrders = read("lib/server/work-order-store.ts");
const migrationPath = "prisma/migrations/20260712010000_add_work_order_contact_event/migration.sql";
const migration = fs.existsSync(migrationPath) ? read(migrationPath) : "";
const vercel = fs.existsSync("vercel.json") ? read("vercel.json") : "";
const failures = [];

[
  "model WorkOrderContactEvent",
  "workOrderId",
  "channel",
  "contactedAt",
  "nextFollowUpAt",
  "@@index([workOrderId])"
].forEach((text) => { if (!schema.includes(text)) failures.push(`Contact model missing: ${text}`); });

[
  "export type WorkOrderContactChannel",
  "export type WorkOrderContactEvent",
  "contactHistory",
  "lastContactAt",
  "nextFollowUpAt"
].forEach((text) => { if (!types.includes(text)) failures.push(`Work order contact type missing: ${text}`); });

[
  "getWorkOrderContactEvents",
  "createWorkOrderContactEvent",
  "Follow-up cannot be before contact time",
  "Email",
  "WhatsApp",
  "Phone",
  "Other"
  ,"P2021"
  ,"ensureWorkOrderContactTable"
  ,'CREATE TABLE IF NOT EXISTS "WorkOrderContactEvent"'
].forEach((text) => { if (!store.includes(text)) failures.push(`Contact store missing: ${text}`); });

[
  "getWorkOrderContactEvents",
  "createWorkOrderContactEvent",
  "contactEvent",
  "contactHistory"
  ,"nextFollowUpAt"
].forEach((text) => { if (!workOrders.includes(text)) failures.push(`Work-order aggregation missing: ${text}`); });

if (!migration.includes('CREATE TABLE IF NOT EXISTS "WorkOrderContactEvent"')) failures.push("Idempotent additive contact-event migration is missing.");
if (vercel.includes("prisma migrate deploy")) failures.push("Vercel builds must not block on a database migration connection.");

if (failures.length) {
  console.error("Work-order contact log checks failed:");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log("Work-order contact log checks passed.");
