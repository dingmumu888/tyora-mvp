import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("source showcase migration is additive, private by default, and consent-gated", async () => {
  const migration = await read("prisma/migrations/20260729030000_source_public_activity/migration.sql");

  assert.match(migration, /"publicShowcaseConsent" BOOLEAN NOT NULL DEFAULT false/);
  assert.match(migration, /"publicShowcasePublished" BOOLEAN NOT NULL DEFAULT false/);
  assert.match(migration, /NOT "publicShowcasePublished" OR "publicShowcaseConsent"/);
  assert.match(migration, /"publicShowcaseImageIndex" BETWEEN 0 AND 8/);
  assert.doesNotMatch(migration, /\bDROP\b/i);
  assert.doesNotMatch(migration, /\bDELETE\b/i);
  assert.doesNotMatch(migration, /\bTRUNCATE\b/i);
});

test("public source activity uses a strict allowlist without contact or internal fields", async () => {
  const store = await read("lib/server/source-store.ts");
  const publicFunction = store.match(/export async function getPublicSourceActivities[\s\S]+?\n}\n\nexport async function updateSourceRequest/)?.[0] || "";

  assert.match(publicFunction, /publicShowcaseConsent: true/);
  assert.match(publicFunction, /publicShowcasePublished: true/);
  assert.match(publicFunction, /select: \{/);
  assert.doesNotMatch(publicFunction, /\bemail:\s*true/);
  assert.doesNotMatch(publicFunction, /\bwhatsapp:\s*true/);
  assert.doesNotMatch(publicFunction, /\bproductLink:\s*true/);
  assert.doesNotMatch(publicFunction, /\btargetPrice:\s*true/);
  assert.doesNotMatch(publicFunction, /\binternalNotes:\s*true/);
  assert.match(publicFunction, /createHash\("sha256"\)\.update\(row\.id\)/);
  assert.doesNotMatch(publicFunction, /\bid:\s*row\.id/);
  assert.match(publicFunction, /\.slice\(0, 10\)/);
});

test("public endpoint cannot fall back to the private admin request list", async () => {
  const [publicRoute, privateRoute] = await Promise.all([
    read("app/api/source/activity/route.ts"),
    read("app/api/source/route.ts")
  ]);

  assert.match(publicRoute, /getPublicSourceActivities/);
  assert.doesNotMatch(publicRoute, /getSourceRequests/);
  assert.match(privateRoute, /export async function GET\(\) \{\s+const unauthorized = await requireAdminSession\(\)/);
});

test("submission consent is optional and publishing remains an admin-reviewed action", async () => {
  const [sourcePage, admin, store] = await Promise.all([
    read("app/source/source-client.tsx"),
    read("app/admin/source/source-admin-client.tsx"),
    read("lib/server/source-store.ts")
  ]);

  assert.match(sourcePage, /publicShowcaseConsent: false/);
  assert.match(sourcePage, /Allow anonymous sourcing activity/);
  assert.match(admin, /disabled=\{!request\.publicShowcaseConsent\}/);
  assert.match(admin, /Publish anonymous activity/);
  assert.match(store, /if \(publishRequested && !existing\.publicShowcaseConsent\)/);
  assert.match(store, /Add a public activity title before publishing/);
});

test("early social proof is clearly labeled and replaced by approved real activity", async () => {
  const sourcePage = await read("app/source/source-client.tsx");

  assert.match(sourcePage, /isDemo: true/);
  assert.match(sourcePage, /Sourcing example/);
  assert.match(sourcePage, /publicActivities\.length >= 3/);
  assert.match(sourcePage, /Customer approved/);
});
