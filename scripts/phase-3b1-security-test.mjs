import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  canInteractWithIdea,
  canReadIdea,
  isApprovedPublicIdea
} from "../lib/server/idea-access-policy.ts";
import {
  isVerificationLocked,
  nextVerificationFailure,
  normalizeVerificationEmail,
  verificationThrottleConfig
} from "../lib/server/email-verification-policy.ts";
import {
  parsePublicLeadSubmission,
  readPublicLeadRequest
} from "../lib/server/lead-submission-policy.ts";
import {
  isAllowedPrivateFileAccessUrl,
  validatePrivateUploadBytes
} from "../lib/server/private-storage-policy.ts";

const approvedPublicIdea = {
  authorId: "author-1",
  visibility: "Public",
  moderationStatus: "Approved",
  status: "Discussing",
  hidden: false
};

const restrictedIdeas = [
  { ...approvedPublicIdea, visibility: "Private" },
  { ...approvedPublicIdea, hidden: true },
  { ...approvedPublicIdea, moderationStatus: "Pending" },
  { ...approvedPublicIdea, moderationStatus: "Rejected" },
  { ...approvedPublicIdea, moderationStatus: "Draft" },
  { ...approvedPublicIdea, status: "Draft" }
];

test("only approved public Ideas are anonymously readable and interactive", () => {
  assert.equal(isApprovedPublicIdea(approvedPublicIdea), true);
  assert.equal(canReadIdea(approvedPublicIdea), true);
  assert.equal(canInteractWithIdea(approvedPublicIdea), true);
  for (const idea of restrictedIdeas) {
    assert.equal(canReadIdea(idea), false);
    assert.equal(canInteractWithIdea(idea), false);
  }
  assert.equal(isApprovedPublicIdea({ ...approvedPublicIdea, moderationStatus: undefined }), false);
});

test("restricted Ideas are available only to their author or an admin", () => {
  for (const idea of restrictedIdeas) {
    assert.equal(canReadIdea(idea, { userId: "other-user" }), false);
    assert.equal(canInteractWithIdea(idea, { userId: "other-user" }), false);
    assert.equal(canReadIdea(idea, { userId: "author-1" }), true);
    assert.equal(canInteractWithIdea(idea, { userId: "author-1" }), true);
    assert.equal(canReadIdea(idea, { isAdmin: true }), true);
    assert.equal(canInteractWithIdea(idea, { isAdmin: true }), true);
  }
});

test("public Lead input rejects every privileged and unexpected field", () => {
  const privilegedFields = [
    "id",
    "status",
    "owner",
    "ownerId",
    "priority",
    "internalNotes",
    "submissionDate",
    "lastContactDate",
    "nextFollowUpDate",
    "statusHistory",
    "internalNoteEntries",
    "assignment"
  ];
  for (const field of privilegedFields) {
    const result = parsePublicLeadSubmission(
      { productIdea: "Safe test idea", [field]: "attacker-controlled" },
      isAllowedPrivateFileAccessUrl
    );
    assert.equal(result.data, undefined, field);
    assert.match(result.error || "", /invalid project submission fields/i, field);
  }
});

test("public Lead input accepts only the documented customer fields", () => {
  const result = parsePublicLeadSubmission(
    {
      customerName: "Preview Tester",
      email: " USER@EXAMPLE.COM ",
      productIdea: "A bounded test idea",
      uploadedFiles: []
    },
    isAllowedPrivateFileAccessUrl
  );
  assert.equal(result.error, undefined);
  assert.equal(result.data?.email, "user@example.com");
  assert.equal(result.data?.productIdea, "A bounded test idea");

  const wrongType = parsePublicLeadSubmission(
    { productIdea: "Safe idea", customerName: { injected: true } },
    isAllowedPrivateFileAccessUrl
  );
  assert.equal(wrongType.data, undefined);
  assert.match(wrongType.error || "", /customerName must be text/i);
});

test("public Lead request rejects oversized JSON before creation", async () => {
  const request = new Request("https://preview.invalid/api/leads", {
    method: "POST",
    headers: {
      "content-length": String(65 * 1024),
      "content-type": "application/json"
    },
    body: JSON.stringify({ productIdea: "test" })
  });
  const result = await readPublicLeadRequest(request, isAllowedPrivateFileAccessUrl);
  assert.deepEqual(result, { error: "Project submission is too large.", status: 413 });
});

test("public Lead request stops reading an oversized body without a declared length", async () => {
  const request = new Request("https://preview.invalid/api/leads", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ productIdea: "x".repeat(70 * 1024) })
  });
  const result = await readPublicLeadRequest(request, isAllowedPrivateFileAccessUrl);
  assert.deepEqual(result, { error: "Project submission is too large.", status: 413 });
});

test("Lead runtime is create-only and cannot upsert an existing operational record", async () => {
  const source = await readFile(new URL("../lib/server/data-store.ts", import.meta.url), "utf8");
  const publicRoute = await readFile(new URL("../app/api/leads/route.ts", import.meta.url), "utf8");
  const adminRoute = await readFile(new URL("../app/api/admin/leads/route.ts", import.meta.url), "utf8");
  const start = source.indexOf("export async function createPublicLead");
  const end = source.indexOf("export async function putLeads", start);
  const createBlock = source.slice(start, end);
  assert.match(createBlock, /prisma\.lead\.create\(/);
  assert.doesNotMatch(createBlock, /upsert|update\(/);
  assert.match(createBlock, /crypto\.randomUUID\(\)/);
  assert.match(createBlock, /status:\s*"New"/);
  assert.match(createBlock, /ownerId:\s*"unassigned"/);
  assert.match(createBlock, /internalNotes:\s*null/);
  assert.match(publicRoute, /export async function POST/);
  assert.doesNotMatch(publicRoute, /export async function (?:GET|PUT|PATCH|DELETE)/);
  assert.match(publicRoute, /submitted:\s*true/);
  assert.doesNotMatch(publicRoute, /getLeads|putLeads|requireAdminSession/);
  assert.match(adminRoute, /requireAdminSession/);
  assert.match(adminRoute, /export async function GET/);
  assert.match(adminRoute, /export async function PUT/);
});

test("route and API access checks use the centralized Idea policy", async () => {
  const files = [
    "app/ask/[slug]/page.tsx",
    "app/api/community/ideas/[slug]/comments/route.ts",
    "app/api/community/ideas/[slug]/reaction/route.ts",
    "app/api/community/ideas/[slug]/comments/[commentId]/route.ts"
  ];
  for (const file of files) {
    const source = await readFile(new URL(`../${file}`, import.meta.url), "utf8");
    assert.match(source, /idea-access-(?:context|policy)|getCommunityIdeaBySlug/, file);
  }
  const store = await readFile(new URL("../lib/server/community-store.ts", import.meta.url), "utf8");
  assert.match(store, /assertCanInteractWithIdea/);
  assert.match(store, /approvedPublicIdeaWhere/);
  assert.match(store, /where:\s*\{ authorId: userId \}/);
});

test("private Idea and Custom media fail closed with non-cacheable 404 responses", async () => {
  const privateIdeaRoute = await readFile(
    new URL("../app/api/community/private-ideas/[slug]/images/[index]/route.ts", import.meta.url),
    "utf8"
  );
  const publicIdeaRoute = await readFile(
    new URL("../app/api/community/ideas/[slug]/images/[index]/route.ts", import.meta.url),
    "utf8"
  );
  const customFileRoute = await readFile(new URL("../app/api/leads/files/route.ts", import.meta.url), "utf8");
  assert.match(privateIdeaRoute, /getCurrentIdeaAccessContext/);
  assert.match(privateIdeaRoute, /status:\s*404/);
  assert.match(privateIdeaRoute, /"Cache-Control":\s*"private, no-store"/);
  assert.doesNotMatch(privateIdeaRoute, /public, max-age|NextResponse\.redirect/);
  assert.match(publicIdeaRoute, /image\.access !== "public"/);
  assert.match(publicIdeaRoute, /privateNotFoundHeaders/);
  assert.match(publicIdeaRoute, /"Cache-Control":\s*"private, no-store"/);
  assert.match(customFileRoute, /hasAdminSession/);
  assert.match(customFileRoute, /status:\s*404/);
  assert.match(customFileRoute, /"Cache-Control":\s*"private, no-store"/);
});

test("private image validation rejects a spoofed MIME type", () => {
  assert.throws(
    () => validatePrivateUploadBytes({
      displayName: "idea.png",
      mimeType: "image/png",
      size: 8,
      header: new Uint8Array([0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0, 0])
    }),
    /signature/i
  );
});

test("verification policy normalizes email and locks then expires", () => {
  const config = verificationThrottleConfig({});
  assert.equal(normalizeVerificationEmail(" User@Example.COM "), "user@example.com");
  const start = new Date("2026-07-16T00:00:00.000Z");
  let state = null;
  for (let attempt = 0; attempt < config.emailFailureLimit; attempt += 1) {
    state = nextVerificationFailure(state, config.emailFailureLimit, config, new Date(start.getTime() + attempt * 1000));
  }
  assert.equal(isVerificationLocked(state, new Date(start.getTime() + 10_000)), true);
  assert.equal(isVerificationLocked(state, new Date(state.expiresAt.getTime() + 1)), false);
  const reset = nextVerificationFailure(state, config.emailFailureLimit, config, new Date(state.expiresAt.getTime() + 1));
  assert.equal(reset.failureCount, 1);
  assert.equal(reset.lockedUntil, null);
});

test("verification attempts are persisted for normalized email and IP with generic failures", async () => {
  const throttle = await readFile(new URL("../lib/server/email-verification-throttle.ts", import.meta.url), "utf8");
  const login = await readFile(new URL("../lib/server/email-login.ts", import.meta.url), "utf8");
  const route = await readFile(new URL("../app/api/community/auth/email/verify/route.ts", import.meta.url), "utf8");
  assert.match(throttle, /emailVerificationThrottle/);
  assert.match(throttle, /scope:\s*"ip"/);
  assert.match(throttle, /scope:\s*"email"/);
  assert.match(throttle, /recordVerificationFailure/);
  assert.match(throttle, /TransactionIsolationLevel\.Serializable/);
  assert.match(throttle, /P2034/);
  assert.match(login, /isVerificationAttemptAllowed/);
  assert.match(login, /updateMany/);
  assert.match(login, /usedAt:\s*now/);
  assert.match(login, /deleteMany/);
  assert.doesNotMatch(login, /tyora-email-login-dev/);
  assert.doesNotMatch(throttle, /tyora-email-throttle-dev/);
  assert.match(route, /Unable to verify code\./);
  assert.doesNotMatch(route, /Invalid or expired|account exists|registered/);
});

test("migration adds moderation and persistent verification throttle only", async () => {
  const migration = await readFile(
    new URL("../prisma/migrations/20260716010000_phase_3b1_security_foundation/migration.sql", import.meta.url),
    "utf8"
  );
  assert.match(migration, /ADD COLUMN IF NOT EXISTS "moderationStatus"/);
  assert.match(migration, /ALTER COLUMN "moderationStatus" SET DEFAULT 'Pending'/);
  assert.match(migration, /CREATE TABLE IF NOT EXISTS "EmailVerificationThrottle"/);
  assert.doesNotMatch(migration, /DROP|TRUNCATE|DELETE FROM|UPDATE /i);
});

test("author edits return an approved Idea to moderation", async () => {
  const store = await readFile(new URL("../lib/server/community-store.ts", import.meta.url), "utf8");
  const start = store.indexOf("export async function updateCommunityIdeaOwner");
  const end = store.indexOf("export async function withdrawCommunityIdeaOwner", start);
  const ownerUpdate = store.slice(start, end);
  assert.match(ownerUpdate, /moderationStatus:\s*"Pending"/);
  assert.match(ownerUpdate, /homepageFeatured:\s*false/);
  assert.match(ownerUpdate, /ownerIdeaImageUrls/);
});
