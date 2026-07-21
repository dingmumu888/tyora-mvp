import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  assertCommunityActionAllowed,
  CommunityActionPolicyError,
  nextCommunityThrottle,
  normalizeIdempotencyKey
} from "../lib/server/community-action-policy.ts";
import {
  assertCanReadCustomInquiry,
  canReadCustomInquiry,
  CustomInquiryNotFoundError,
  parseCustomInquirySubmission
} from "../lib/server/custom-inquiry-policy.ts";
import {
  buildPrivateCustomObjectPath,
  isAllowedPrivateCustomObjectPath
} from "../lib/server/private-storage-policy.ts";

const file = async (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("Custom inquiries are readable only by their owner or an admin", () => {
  const inquiry = { userId: "user-owner" };
  assert.equal(canReadCustomInquiry(inquiry, { userId: "user-owner" }), true);
  assert.equal(canReadCustomInquiry(inquiry, { userId: "user-other" }), false);
  assert.equal(canReadCustomInquiry(inquiry, { isAdmin: true }), true);
  assert.throws(
    () => assertCanReadCustomInquiry(inquiry, { userId: "user-other" }),
    (error) => error instanceof CustomInquiryNotFoundError
  );
});

test("customer Custom payloads reject privileged and unexpected fields", () => {
  const safe = parseCustomInquirySubmission({
    productName: "Synthetic product",
    productDescription: "Synthetic description",
    category: "Synthetic category",
    quantity: "100 units",
    targetMarket: "Synthetic market",
    contactEmail: " USER@EXAMPLE.TEST "
  });
  assert.equal(safe.contactEmail, "user@example.test");

  for (const field of ["id", "userId", "status", "nextStep", "privateFilesJson", "assessmentSnapshotJson"]) {
    assert.throws(
      () => parseCustomInquirySubmission({ productName: "Safe", [field]: "client-controlled" }),
      /invalid custom inquiry fields/i,
      field
    );
  }
});

test("community actions require bounded idempotency keys", () => {
  assert.equal(normalizeIdempotencyKey("phase3b2.synthetic-key_123"), "phase3b2.synthetic-key_123");
  for (const value of [undefined, "short", "contains spaces and is long", "x".repeat(161)]) {
    assert.throws(
      () => normalizeIdempotencyKey(value),
      (error) => error instanceof CommunityActionPolicyError && error.status === 400
    );
  }
});

test("community action throttle resets after its window and blocks at the limit", () => {
  const start = new Date("2026-07-17T00:00:00.000Z");
  const first = nextCommunityThrottle(null, 10, start);
  assert.equal(first.count, 1);
  assert.doesNotThrow(() => assertCommunityActionAllowed(first, 2, new Date(start.getTime() + 1_000)));
  const second = nextCommunityThrottle(first, 10, new Date(start.getTime() + 1_000));
  assert.throws(
    () => assertCommunityActionAllowed(second, 2, new Date(start.getTime() + 2_000)),
    (error) => error instanceof CommunityActionPolicyError && error.status === 429
  );
  const reset = nextCommunityThrottle(second, 10, second.expiresAt);
  assert.equal(reset.count, 1);
});

test("private Custom object paths never overlap the public CMS namespace", () => {
  const objectPath = buildPrivateCustomObjectPath(".pdf", {
    now: new Date("2026-07-17T12:00:00.000Z"),
    id: "123e4567-e89b-42d3-a456-426614174000"
  });
  assert.match(objectPath, /^custom-submissions\//);
  assert.equal(isAllowedPrivateCustomObjectPath(objectPath), true);
  assert.equal(isAllowedPrivateCustomObjectPath("cms/customer-design.pdf"), false);
  assert.equal(isAllowedPrivateCustomObjectPath("custom-submissions/../../secret.pdf"), false);
});

test("moderation and structured assessment publication are atomic and approval-gated", async () => {
  const store = await file("lib/server/community-store.ts");
  const start = store.indexOf("export async function updateCommunityIdeaAdmin");
  const end = store.indexOf("export async function deleteCommunityIdeaAdmin", start);
  const block = store.slice(start, end);
  assert.match(block, /Only approved ideas can publish a public assessment/);
  assert.match(block, /Published assessments require feasibility, cost range, MOQ, assumptions, confidence, and disclaimer/);
  assert.match(block, /prisma\.\$transaction/);
  assert.match(block, /tx\.communityIdea\.update/);
  assert.match(block, /tx\.tyoraReview\.upsert/);
  assert.match(block, /assessmentStatus:\s*"Draft", publishedAt:\s*null/);
});

test("private Custom routes fail closed and never expose Storage URLs or object paths", async () => {
  const itemRoute = await file("app/api/community/custom/[id]/route.ts");
  const fileRoute = await file("app/api/community/custom/[id]/files/[index]/route.ts");
  const adminRoute = await file("app/api/admin/custom-inquiries/route.ts");
  const store = await file("lib/server/custom-inquiry-store.ts");
  assert.match(itemRoute, /if \(!session && !isAdmin\) return privateFail\("Not found\.", 404\)/);
  assert.match(itemRoute, /function privateFail/);
  assert.match(itemRoute, /"Cache-Control": "private, no-store"/);
  assert.match(fileRoute, /createPrivateSignedUrl\(file\.objectPath, 120\)/);
  assert.match(fileRoute, /redirect: "error"/);
  assert.match(fileRoute, /"Cache-Control": "private, no-store"/);
  assert.doesNotMatch(fileRoute, /NextResponse\.redirect|storage\/v1\/object\/public/);
  assert.match(adminRoute, /requireAdminSession/);
  const publicMapper = store.slice(store.indexOf("function customInquiryPublic"), store.indexOf("function publishedAssessmentSnapshot"));
  const returnedShape = publicMapper.slice(publicMapper.indexOf("return {"));
  assert.doesNotMatch(returnedShape, /objectPath|privateFilesJson/);
});

test("interactions use server-side uniqueness, idempotency, and persistent rate limits", async () => {
  const guard = await file("lib/server/community-action-guard.ts");
  const migration = await file("prisma/migrations/20260717010000_phase_3b2_ideas_custom_workflow/migration.sql");
  const routes = await Promise.all([
    file("app/api/community/ideas/[slug]/reaction/route.ts"),
    file("app/api/community/ideas/[slug]/comments/route.ts"),
    file("app/api/community/ideas/[slug]/comments/[commentId]/route.ts"),
    file("app/api/community/ideas/[slug]/share/route.ts")
  ]);
  assert.match(guard, /TransactionIsolationLevel\.Serializable/);
  assert.match(guard, /privateDigest\("user"/);
  assert.match(guard, /privateDigest\("ip"/);
  assert.match(guard, /communityActionReceipt/);
  assert.match(migration, /CREATE UNIQUE INDEX "CommunityShare_userId_ideaId_channel_key"/);
  assert.match(migration, /CREATE TABLE "CommunityActionThrottle"/);
  assert.match(migration, /CREATE TABLE "CommunityActionReceipt"/);
  routes.forEach((source) => assert.match(source, /request/));
});

test("public submission consent, CMS options, Custom CTA, and TYORA Case disclosure remain wired", async () => {
  const form = await file("app/ask/new/new-idea-client.tsx");
  const detail = await file("app/ask/[slug]/page.tsx");
  const feed = await file("app/ask/page.tsx");
  const caseDetail = await file("app/ask/case/[slug]/page.tsx");
  const admin = await file("app/admin/community/community-admin-client.tsx");
  const storage = await file("lib/storage.ts");
  for (const consent of ["publicContentConsent", "publicImageConsent", "publicAssessmentConsent"]) {
    assert.match(form, new RegExp(consent));
  }
  assert.match(form, /Submit for Review/);
  assert.match(detail, /customEligible/);
  assert.match(detail, /startCustomProjectText/);
  assert.match(feed, /CommunityCard/);
  assert.match(feed, /TYORA Case/);
  assert.match(feed, /Demonstration Project/);
  assert.match(caseDetail, /not a verified customer production result/);
  for (const editableField of [
    "feasibilityOptions",
    "confidenceOptions",
    "hotScoreThreshold",
    "commentRateLimit",
    "shareRateLimit",
    "showCasesInFeed",
    "customPage"
  ]) {
    assert.match(admin + storage, new RegExp(editableField), editableField);
  }
});

test("Phase 3B-2 migration is additive and does not mutate or remove existing records", async () => {
  const migration = await file("prisma/migrations/20260717010000_phase_3b2_ideas_custom_workflow/migration.sql");
  assert.doesNotMatch(migration, /DROP|TRUNCATE|DELETE FROM|UPDATE\s+"/i);
  assert.match(migration, /CREATE TABLE "CustomInquiry"/);
  assert.match(migration, /ADD COLUMN "publicConsentAt"/);
  assert.match(migration, /ALTER COLUMN "assessmentStatus" SET DEFAULT 'Draft'/);
});

test("test infrastructure is not imported by Preview or Production runtime", async () => {
  const runtimeFiles = [
    "app/api/community/auth/email/request/route.ts",
    "app/api/community/auth/email/verify/route.ts",
    "lib/server/community-auth.ts",
    "lib/server/email-login.ts"
  ];
  for (const path of runtimeFiles) {
    const source = await file(path);
    assert.doesNotMatch(source, /scripts\/|__tests__|test-helper|auth-bypass|development-login/i, path);
  }
});
