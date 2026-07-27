import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const file = async (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("Phase 5A defines one shared workflow over existing record identities", async () => {
  const schema = await file("prisma/schema.prisma");

  assert.match(schema, /model SubmissionWorkflow \{/);
  assert.match(schema, /recordKind\s+SubmissionRecordKind/);
  assert.match(schema, /sourceId\s+String/);
  assert.match(schema, /@@unique\(\[recordKind, sourceId\]\)/);
  for (const value of ["COMMUNITY_IDEA", "CUSTOM_INQUIRY", "SOURCE_REQUEST", "LEAD"]) {
    assert.match(schema, new RegExp(`\\b${value}\\b`));
  }
  for (const existing of ["CommunityIdea", "CustomInquiry", "SourceRequest", "Lead", "WorkOrderContactEvent"]) {
    assert.match(schema, new RegExp(`model ${existing} \\{`));
  }
  assert.doesNotMatch(schema, /model WorkOrder\s*\{/);
});

test("qualification, lifecycle, service, payment, and privacy values are complete", async () => {
  const schema = await file("prisma/schema.prisma");
  for (const value of [
    "UNREVIEWED", "QUALIFIED", "NEED_MORE_INFORMATION", "OUT_OF_SCOPE", "LOW_BUDGET", "HIGH_RISK", "SPAM",
    "NEW", "UNDER_REVIEW", "REVIEW_SENT", "KICKOFF_PENDING", "FACTORY_SOURCING", "QUOTING", "SAMPLING",
    "PRODUCTION", "QUALITY_INSPECTION", "DELIVERED", "REORDER", "CLOSED", "LOST",
    "FREE_ASSESSMENT", "SOURCE_INTRODUCTION", "SOURCE_MANAGED", "CUSTOM_INTRODUCTION", "CUSTOM_MANAGED",
    "REORDER_MANAGED", "INSPECTION_ONLY", "NOT_REQUIRED", "PENDING", "PAID", "PARTIALLY_PAID",
    "REFUNDED", "CANCELLED", "PUBLIC", "PRIVATE"
  ]) assert.match(schema, new RegExp(`\\b${value}\\b`), value);
});

test("commercial values use integer minor units and explicit currency", async () => {
  const [schema, migration] = await Promise.all([
    file("prisma/schema.prisma"),
    file("prisma/migrations/20260720010000_phase_5a_submission_workflow/migration.sql")
  ]);

  for (const field of ["estimatedOrderValueMinor", "minimumFeeMinor", "finalAgreedServiceFeeMinor", "kickoffFeeMinor"]) {
    assert.match(schema, new RegExp(`${field}\\s+BigInt\\?`), field);
    assert.match(migration, new RegExp(`"${field}" BIGINT`), field);
  }
  assert.match(schema, /feePercentageBasisPoints\s+Int\?/);
  assert.match(schema, /currencyCode\s+String\?\s+@db\.VarChar\(3\)/);
  assert.match(migration, /SubmissionWorkflow_money_nonnegative_check/);
  assert.match(migration, /SubmissionWorkflow_currency_required_check/);
  assert.match(migration, /SubmissionWorkflow_fee_percentage_check/);
  assert.doesNotMatch(schema, /estimatedOrderValue\s+(Float|Decimal)/);
});

test("owner and actor fields reuse TeamMember while preserving immutable snapshots", async () => {
  const [schema, migration] = await Promise.all([
    file("prisma/schema.prisma"),
    file("prisma/migrations/20260720010000_phase_5a_submission_workflow/migration.sql")
  ]);

  assert.match(schema, /assignedOwner\s+TeamMember\?/);
  assert.match(schema, /actorIdentifierSnapshot\s+String/g);
  assert.match(schema, /actorLabelSnapshot\s+String/g);
  assert.match(migration, /REFERENCES "TeamMember"\("id"\)\s+ON DELETE SET NULL/g);
  assert.match(migration, /CREATE TRIGGER "WorkflowStatusEvent_immutable"/);
  assert.match(migration, /CREATE TRIGGER "ModerationVisibilityAuditEvent_immutable"/);
  assert.match(migration, /BEFORE UPDATE OR DELETE ON "WorkflowStatusEvent"/);
  assert.match(migration, /BEFORE UPDATE OR DELETE ON "ModerationVisibilityAuditEvent"/);
});

test("moderation audit covers required actions and enforces private-to-public confirmation", async () => {
  const [schema, migration] = await Promise.all([
    file("prisma/schema.prisma"),
    file("prisma/migrations/20260720010000_phase_5a_submission_workflow/migration.sql")
  ]);

  assert.match(schema, /model ModerationVisibilityAuditEvent \{/);
  for (const action of ["APPROVE", "HIDE", "ARCHIVE", "MARK_SPAM", "FEATURE", "SET_PUBLIC", "SET_PRIVATE", "CONFIRM_PRIVATE_TO_PUBLIC"]) {
    assert.match(schema, new RegExp(`\\b${action}\\b`), action);
  }
  assert.match(migration, /ModerationVisibilityAuditEvent_private_to_public_check/);
  assert.match(migration, /"previousPrivacyState" = 'PRIVATE'/);
  assert.match(migration, /"newPrivacyState" = 'PUBLIC'/);
  assert.match(migration, /"privateToPublicConfirmed" = true/);
});

test("migration is schema-only, additive, and leaves existing tables untouched", async () => {
  const migration = await file("prisma/migrations/20260720010000_phase_5a_submission_workflow/migration.sql");

  assert.match(migration, /CREATE TABLE "SubmissionWorkflow"/);
  assert.match(migration, /CREATE TABLE "WorkflowStatusEvent"/);
  assert.match(migration, /CREATE TABLE "ModerationVisibilityAuditEvent"/);
  assert.doesNotMatch(migration, /DROP\s+(TABLE|COLUMN|TYPE|INDEX)/i);
  assert.doesNotMatch(migration, /TRUNCATE|DELETE\s+FROM|INSERT\s+INTO|UPDATE\s+"/i);
  assert.doesNotMatch(migration, /ALTER\s+TABLE\s+"(CommunityIdea|CustomInquiry|SourceRequest|Lead|WorkOrderContactEvent)"/i);
});

test("legacy mapping documents every current source status and flags ambiguity", async () => {
  const plan = await file("docs/phase-5a-workflow-migration.md");
  const statuses = [
    "Discussing", "TYORA Reviewing", "Project Started", "Manufacturing", "Shipping", "Completed",
    "Submitted", "In Review", "Need Information", "Qualified", "Closed",
    "New", "Checking Supplier", "Quoted", "Sample Requested", "Factory Introduced", "Managed Sourcing",
    "Contacted", "Quoting", "Sample Stage", "Production", "Shipment", "Lost"
  ];
  for (const status of statuses) assert.ok(plan.includes(`| \`${status}\` |`), status);
  assert.match(plan, /manualReviewRequired = true/);
  assert.match(plan, /must exclude them from stage KPIs/);
  assert.match(plan, /must not update legacy records/);
  assert.match(plan, /must never run against Production/);
});
