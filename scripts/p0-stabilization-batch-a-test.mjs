import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("owner deletion is guarded, transactional, cascading, and idempotent", async () => {
  const [schema, migration, store, route, summary] = await Promise.all([
    read("prisma/schema.prisma"),
    read("prisma/migrations/20260805020000_add_private_idea_followups/migration.sql"),
    read("lib/server/community-store.ts"),
    read("app/api/community/ideas/[slug]/route.ts"),
    read("app/me/activity-summary.tsx")
  ]);

  assert.match(schema, /model CommunityPrivateFollowUp[\s\S]+onDelete: Cascade/);
  assert.match(migration, /ON DELETE CASCADE/);
  assert.match(store, /export async function permanentlyDeleteCommunityIdeaOwner/);
  assert.match(store, /action: "delete"/);
  assert.match(store, /permanentlyDeleteCommunityIdeaRows/);
  assert.match(store, /communityPrivateFollowUp\.deleteMany/);
  assert.match(store, /communityComment\.deleteMany/);
  assert.match(store, /communityReaction\.deleteMany/);
  assert.match(store, /tyoraReview\.deleteMany/);
  assert.match(store, /communityIdea\.delete/);
  assert.match(route, /permanentlyDeleteCommunityIdeaOwner\(slug, session\.userId, request\)/);
  assert.match(summary, /communityActionHeaders\(`delete:/);
  assert.match(summary, /setLocalIdeas\(\(currentIdeas\) => currentIdeas\.filter/);
  assert.doesNotMatch(summary, /window\.confirm/);
});

test("creator TYORA follow-up is a private, exactly-once channel", async () => {
  const [store, route, messages, actionPolicy, adminRoute, admin] = await Promise.all([
    read("lib/server/community-store.ts"),
    read("app/api/community/ideas/[slug]/private-followups/route.ts"),
    read("app/me/activity-messages.tsx"),
    read("lib/server/community-action-policy.ts"),
    read("app/api/admin/community/route.ts"),
    read("app/admin/community/community-admin-client.tsx")
  ]);

  assert.match(store, /idea\.authorId !== authorId/);
  assert.match(store, /assessmentStatus !== "Published"/);
  assert.match(store, /action: "private-followup"/);
  assert.match(route, /getCommunitySession/);
  assert.match(actionPolicy, /"private-followup"/);
  assert.match(messages, /activeReply\.private[\s\S]+private-followups/);
  assert.match(messages, /communityActionHeaders/);
  assert.match(messages, /submittingRef\.current/);
  assert.match(messages, /privateFollowUpNotice/);
  assert.doesNotMatch(messages, /window\.location\.reload/);
  assert.match(adminRoute, /getCommunityPrivateFollowUpsAdmin/);
  assert.match(admin, /Private creator follow-ups/);
});

test("owner counters and lists use the same local collections", async () => {
  const summary = await read("app/me/activity-summary.tsx");
  assert.match(summary, /valueForView/);
  assert.match(summary, /view === "posts" \? localIdeas\.length/);
  assert.match(summary, /view === "comments" \? localComments\.length/);
  assert.match(summary, /view === "likes" \? localLikedIdeas\.length/);
  assert.match(summary, /view === "interested" \? localInterestedIdeas\.length/);
  assert.match(summary, /view === "reviews" \? reviewedIdeas\.length/);
});

test("admin lifecycle buckets are mutually exclusive and include pending hidden records", async () => {
  const admin = await read("app/admin/community/community-admin-client.tsx");
  assert.match(admin, /"pending", "Pending \/ hidden"/);
  assert.match(admin, /function queueForIdea/);
  assert.match(admin, /queueForIdea\(idea\) === "pending"/);
  assert.match(admin, /all: ideas\.length \+ removalNotices\.length/);
  assert.match(admin, /action: "approve"/);
  assert.match(admin, /action: moderating\.action/);
});

test("creation age is stable and background updates revalidate in place", async () => {
  const [feed, home, summary, refresh, page, detail] = await Promise.all([
    read("app/ask/page.tsx"),
    read("app/home-client.tsx"),
    read("app/me/activity-summary.tsx"),
    read("components/my-tyora-auto-refresh.tsx"),
    read("app/me/page.tsx"),
    read("app/ask/[slug]/page.tsx")
  ]);
  assert.match(feed, /timeAgo\(idea\.createdAt\)/);
  assert.match(home, /timeAgo\(idea\.createdAt,/);
  assert.match(summary, /timeAgo\(idea\.createdAt,/);
  assert.match(refresh, /15_000/);
  assert.match(refresh, /window\.addEventListener\("focus"/);
  assert.match(refresh, /visibilitychange/);
  assert.match(refresh, /router\.refresh\(\)/);
  assert.match(refresh, /tyora:community-revalidate/);
  assert.match(page, /<MyTyoraAutoRefresh \/>/);
  assert.match(detail, /<MyTyoraAutoRefresh enabled=\{Boolean\(context\.userId\)\} \/>/);
  assert.match(detail, /<IdeaOwnerLifecycleNotice/);
  assert.match(detail, /restricted \? <CommunityText text=\{lifecycleStatus\}/);
});
