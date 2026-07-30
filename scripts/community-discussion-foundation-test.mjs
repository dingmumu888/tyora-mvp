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

test("admin exposes unanswered queue and expert verification controls", async () => {
  const admin = await read("app/admin/community/community-admin-client.tsx");

  assert.match(admin, /"unanswered", "Awaiting First Answer"/);
  assert.match(admin, /idea\.comments\.length === 0/);
  assert.match(admin, /name="authorExpertRole"/);
  assert.match(admin, /name="authorExpertVerified"/);
});

test("community list thumbnails use a balanced mobile-friendly ratio", async () => {
  const page = await read("app/ask/page.tsx");
  const mediaLink = page.match(/<Link href=\{href\} className=\{`relative m-2 aspect-\[4\/3\][^>]+>[\s\S]+?<\/Link>/)?.[0] || "";

  assert.match(page, /grid-cols-\[minmax\(0,1fr\)_104px\]/);
  assert.match(mediaLink, /aspect-\[4\/3\]/);
  assert.match(mediaLink, /story \? "object-cover" : "object-contain p-1\.5"/);
  assert.doesNotMatch(mediaLink, /group-hover:scale/);
});
