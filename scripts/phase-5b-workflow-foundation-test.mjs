import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  assertValidWorkflowTransition,
  assertWorkflowPrivacyTransition,
  mapLegacyWorkflowStatus,
  normalizeWorkflowIdempotencyKey,
  workflowCountsTowardKpis
} from "../lib/server/submission-workflow-policy.ts";

const file = async (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("legacy mappings preserve ambiguity and KPI exclusion", () => {
  assert.deepEqual(mapLegacyWorkflowStatus("COMMUNITY_IDEA", "Discussing"), {
    workflowStatus: "NEW",
    qualification: "UNREVIEWED",
    manualReviewRequired: false,
    manualReviewReason: null
  });
  const ambiguous = mapLegacyWorkflowStatus("SOURCE_REQUEST", "Quoted");
  assert.equal(ambiguous.workflowStatus, "NEW");
  assert.equal(ambiguous.manualReviewRequired, true);
  assert.match(ambiguous.manualReviewReason, /requires Admin review/);
  assert.equal(workflowCountsTowardKpis(ambiguous), false);
  assert.equal(workflowCountsTowardKpis({ manualReviewRequired: false }), true);
});

test("workflow status transitions accept the approved lifecycle only", () => {
  assert.doesNotThrow(() => assertValidWorkflowTransition("NEW", "UNDER_REVIEW"));
  assert.doesNotThrow(() => assertValidWorkflowTransition("DELIVERED", "REORDER"));
  assert.doesNotThrow(() => assertValidWorkflowTransition("REORDER", "PRODUCTION"));
  assert.throws(() => assertValidWorkflowTransition("NEW", "DELIVERED"), /not allowed/);
  assert.throws(() => assertValidWorkflowTransition("CLOSED", "NEW"), /not allowed/);
  assert.throws(() => assertValidWorkflowTransition("LOST", "QUALIFIED"), /not allowed/);
});

test("idempotency keys are mandatory and constrained", () => {
  assert.equal(
    normalizeWorkflowIdempotencyKey("phase5b.request_1234"),
    "phase5b.request_1234"
  );
  assert.throws(() => normalizeWorkflowIdempotencyKey("short"), /valid Idempotency-Key/);
  assert.throws(() => normalizeWorkflowIdempotencyKey("invalid key with spaces"), /valid Idempotency-Key/);
});

test("private to public is limited to approved consented Ideas", () => {
  const approvedIdea = {
    recordKind: "COMMUNITY_IDEA",
    previousState: "PRIVATE",
    nextState: "PUBLIC",
    privateToPublicConfirmed: true,
    publicConsentAt: new Date("2026-07-20T00:00:00.000Z"),
    moderationStatus: "Approved"
  };
  assert.doesNotThrow(() => assertWorkflowPrivacyTransition(approvedIdea));
  assert.throws(
    () => assertWorkflowPrivacyTransition({ ...approvedIdea, recordKind: "CUSTOM_INQUIRY" }),
    /must remain private/
  );
  assert.throws(
    () => assertWorkflowPrivacyTransition({ ...approvedIdea, privateToPublicConfirmed: false }),
    /recorded customer consent/
  );
  assert.throws(
    () => assertWorkflowPrivacyTransition({ ...approvedIdea, publicConsentAt: null }),
    /recorded customer consent/
  );
});

test("server store validates source existence and owns private snapshots", async () => {
  const store = await file("lib/server/submission-workflow-store.ts");

  for (const model of ["communityIdea", "customInquiry", "sourceRequest", "lead"]) {
    assert.match(store, new RegExp(`tx\\.${model}\\.findUnique`), model);
  }
  assert.match(store, /Referenced submission was not found/);
  assert.match(store, /admin:shared-session/);
  assert.match(store, /TYORA Admin/);
  assert.match(store, /customerSnapshotJson:\s*JSON\.stringify\(source\.customerSnapshot\)/);
  assert.match(store, /customerSnapshotJson:\s*undefined/);
  assert.doesNotMatch(store, /input\.(actorId|actorLabel|actorIdentifier|customerSnapshot)/);
  assert.match(store, /TransactionIsolationLevel\.Serializable/g);
});

test("status and privacy writes are replay-safe and auditable", async () => {
  const [store, migration] = await Promise.all([
    file("lib/server/submission-workflow-store.ts"),
    file("prisma/migrations/20260720010000_phase_5a_submission_workflow/migration.sql")
  ]);

  assert.match(store, /status:\$\{idempotencyKey\}/);
  assert.match(store, /privacy:\$\{idempotencyKey\}/);
  assert.match(store, /workflowStatusEvent\.findUnique/);
  assert.match(store, /moderationVisibilityAuditEvent\.findUnique/);
  assert.match(store, /assertValidWorkflowTransition/);
  assert.match(store, /assertWorkflowPrivacyTransition/);
  assert.match(migration, /WorkflowStatusEvent_immutable/);
  assert.match(migration, /ModerationVisibilityAuditEvent_immutable/);
});

test("workflow APIs and customer snapshots are Admin-only", async () => {
  const [collection, detail, status, privacy] = await Promise.all([
    file("app/api/admin/submission-workflows/route.ts"),
    file("app/api/admin/submission-workflows/[id]/route.ts"),
    file("app/api/admin/submission-workflows/[id]/status/route.ts"),
    file("app/api/admin/submission-workflows/[id]/privacy/route.ts")
  ]);
  for (const route of [collection, detail, status, privacy]) {
    assert.match(route, /requireAdminSession/);
    assert.match(route, /private, no-store/);
    assert.match(route, /instanceof SubmissionWorkflowPolicyError/);
    assert.doesNotMatch(route, /messageFromError/);
  }
  const publicReferences = await file("scripts/phase-5b-preview-migration.mjs");
  assert.doesNotMatch(publicReferences, /app\/api\/(community|public)/);
});

test("workflow APIs fail closed without leaking unknown server errors", async () => {
  const routes = await Promise.all([
    file("app/api/admin/submission-workflows/route.ts"),
    file("app/api/admin/submission-workflows/[id]/route.ts"),
    file("app/api/admin/submission-workflows/[id]/status/route.ts"),
    file("app/api/admin/submission-workflows/[id]/privacy/route.ts")
  ]);
  for (const route of routes) {
    assert.match(route, /return fail\("Unable to [^"]+\.", 500\)/);
  }
});

test("KPI queries exclude every unresolved legacy mapping", async () => {
  const store = await file("lib/server/submission-workflow-store.ts");
  assert.match(store, /where:\s*\{\s*manualReviewRequired:\s*false\s*\}/);
});
