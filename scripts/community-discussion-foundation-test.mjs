import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("community migration is additive and gives legacy rows safe defaults", async () => {
  const sql = await read("prisma/migrations/20260729010000_community_discussion_foundation/migration.sql");

  assert.match(sql, /ADD COLUMN "postType" TEXT NOT NULL DEFAULT 'Idea Feedback'/);
  assert.match(sql, /ADD COLUMN "productStage" TEXT NOT NULL DEFAULT 'Concept'/);
  assert.match(sql, /ADD COLUMN "expertVerified" BOOLEAN NOT NULL DEFAULT false/);
  assert.match(sql, /CommunityIdea_post_type_check/);
  assert.match(sql, /CommunityIdea_product_stage_check/);
  assert.doesNotMatch(sql, /\bDROP\b/i);
  assert.doesNotMatch(sql, /\bDELETE\b/i);
  assert.doesNotMatch(sql, /\bTRUNCATE\b/i);
});

test("public publishing stores auditable disclosure evidence", async () => {
  const schema = await read("prisma/schema.prisma");
  const migration = await read("prisma/migrations/20260801010000_add_public_disclosure_evidence/migration.sql");
  const store = await read("lib/server/community-store.ts");

  assert.match(schema, /publicConsentVersion\s+String\?/);
  assert.match(schema, /publicConsentLocale\s+String\?/);
  assert.match(migration, /ADD COLUMN "publicConsentVersion" TEXT/);
  assert.match(migration, /ADD COLUMN "publicConsentLocale" TEXT/);
  assert.match(store, /PUBLIC_DISCLOSURE_NOTICE_VERSION/);
  assert.match(store, /publicConsentVersion: visibility === "Public"/);
  assert.match(store, /publicConsentLocale: visibility === "Public"/);
});

test("new submissions keep internal classification defaults without customer-facing selectors", async () => {
  const [form, store] = await Promise.all([
    read("app/ask/new/new-idea-client.tsx"),
    read("lib/server/community-store.ts")
  ]);

  assert.match(form, /postType: "Idea Feedback" as CommunityPostType/);
  assert.match(form, /productStage: "Concept" as CommunityProductStage/);
  assert.doesNotMatch(form, /communityPostTypes\.map/);
  assert.doesNotMatch(form, /communityProductStages\.map/);
  assert.match(store, /postType: normalizeCommunityPostType/);
  assert.match(store, /productStage: normalizeCommunityProductStage/);
  assert.match(store, /postType,\s+productStage,\s+country,/);
});

test("helpful votes preserve legacy likes while new votes use Helpful", async () => {
  const [store, route, actions] = await Promise.all([
    read("lib/server/community-store.ts"),
    read("app/api/community/ideas/[slug]/reaction/route.ts"),
    read("app/ask/[slug]/idea-actions.tsx")
  ]);

  assert.match(store, /\["Helpful", "Like"\]\.includes\(reaction\.type\)/);
  assert.match(store, /type: type === "Like" \? "Helpful" : type/);
  assert.match(route, /body\.type !== "Helpful"/);
  assert.match(actions, /react\("Helpful"\)/);
});

test("admin exposes the P0 reply and moderation workflow", async () => {
  const admin = await read("app/admin/community/community-admin-client.tsx");

  assert.match(admin, /"needs-reply", "Awaiting reply"/);
  assert.match(admin, /"replied", "Replied"/);
  assert.match(admin, /"returned", "Returned for changes"/);
  assert.match(admin, /"removed", "Removed"/);
  assert.match(admin, /action: "reply"/);
  assert.match(admin, /action: moderating\.action/);
  assert.match(admin, /moderationReason/);
});

test("signed-in users can report public posts and admins see report context", async () => {
  const [route, store, actions, admin] = await Promise.all([
    read("app/api/community/ideas/[slug]/report/route.ts"),
    read("lib/server/community-store.ts"),
    read("app/ask/[slug]/idea-actions.tsx"),
    read("app/admin/community/community-admin-client.tsx")
  ]);

  assert.match(route, /reportCommunityIdea/);
  assert.match(store, /action: "report"/);
  assert.match(store, /You cannot report your own discussion/);
  assert.match(actions, /reportTitle/);
  assert.match(actions, /submitReport/);
  assert.match(admin, /reportReasons/);
  assert.match(admin, /Reported concerns/);
});

test("removed posts are retained for 30 days before scheduled permanent cleanup", async () => {
  const [store, cron, contract] = await Promise.all([
    read("lib/server/community-store.ts"),
    read("app/api/cron/source-weekly-cleanup/route.ts"),
    read("lib/server/storage-provider-contract.ts")
  ]);

  assert.match(store, /retentionDays = Math\.max\(30/);
  assert.match(store, /moderationStatus: "Removed"/);
  assert.match(store, /deletePrivateObject/);
  assert.match(cron, /cleanupRemovedCommunityIdeas/);
  assert.match(contract, /deletePrivateObject/);
});

test("community cards use an independent mobile image rail without changing desktop media", async () => {
  const [page, rail] = await Promise.all([
    read("app/ask/page.tsx"),
    read("components/community-card-image-rail.tsx")
  ]);

  assert.match(page, /grid-cols-\[minmax\(0,1fr\)_104px\]/);
  assert.match(page, /<Link href=\{href\} className="min-w-0 px-3 py-3 sm:px-4">/);
  assert.match(page, /<CommunityCardImageRail[\s\S]+imageUrls=\{imageUrls\}/);
  assert.match(page, /relative m-2 hidden aspect-\[4\/3\][^"]+sm:block/);

  assert.match(rail, /const visibleRows = Math\.min\(Math\.max\(images\.length, 1\), 3\)/);
  assert.match(rail, /data-testid="mobile-card-image-rail"/);
  assert.match(rail, /overflow-y-auto/);
  assert.match(rail, /onClick=\{\(\) => src && setActiveIndex\(index\)\}/);
  assert.match(rail, /fixed inset-0 z-\[100\]/);
});
