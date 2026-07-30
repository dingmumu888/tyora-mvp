import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function source(path) {
  return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

test("weekly Source migration is additive and keeps only minimal archives", async () => {
  const migration = await source("prisma/migrations/20260730020000_add_source_weekly_showcase/migration.sql");
  assert.match(migration, /CREATE TABLE "SourceWeeklyProduct"/);
  assert.match(migration, /"interestCount" INTEGER NOT NULL DEFAULT 0/);
  assert.match(migration, /CREATE TABLE "SourceWeeklyInterest"/);
  assert.match(migration, /UNIQUE INDEX "SourceWeeklyInterest_productId_visitorHash_dayBucket_key"/);
  assert.match(migration, /CREATE TABLE "SourceWeeklyArchive"/);
  assert.doesNotMatch(migration, /DROP TABLE|DROP COLUMN|TRUNCATE/i);
});

test("public weekly products fail closed after the seven-day expiry", async () => {
  const store = await source("lib/server/source-weekly-store.ts");
  assert.match(store, /status: "LIVE"/);
  assert.match(store, /publishedAt: \{ lte: now \}/);
  assert.match(store, /expiresAt: \{ gt: now \}/);
  assert.match(store, /const LIVE_DAYS = 7/);
  assert.match(store, /const PURGE_DAYS = 30/);
  assert.match(store, /take: 8/);
});

test("interest count is deduplicated by visitor and day before increment", async () => {
  const store = await source("lib/server/source-weekly-store.ts");
  const route = await source("app/api/source/weekly/[id]/interest/route.ts");
  assert.match(store, /visitorHash/);
  assert.match(store, /dayBucket/);
  assert.match(store, /interestCount: \{ increment: 1 \}/);
  assert.match(store, /code\?: string.*P2002/s);
  assert.match(route, /httpOnly: true/);
  assert.match(route, /sameSite: "lax"/);
  assert.match(route, /recordWeeklySourceInterest/);
});

test("daily cleanup is secret protected and deletes storage before database details", async () => {
  const cron = await source("app/api/cron/source-weekly-cleanup/route.ts");
  const store = await source("lib/server/source-weekly-store.ts");
  const vercel = await source("vercel.json");
  assert.match(cron, /CRON_SECRET/);
  assert.match(cron, /timingSafeEqual/);
  assert.match(store, /deleteWeeklySourceImage\(row\.imageObjectPath\)/);
  assert.match(store, /archiveAndDelete\(row, now\)/);
  assert.match(store, /sourceWeeklyArchive\.upsert/);
  assert.match(vercel, /source-weekly-cleanup/);
  assert.match(vercel, /15 3 \* \* \*/);
});

test("front end stays a single weekly showcase rather than an ecommerce catalog", async () => {
  const component = await source("components/source-weekly-showcase.tsx");
  const copy = await source("lib/source-weekly.ts");
  assert.match(component, /sourceWeeklyCopy/);
  assert.match(copy, /Get price & factory details/);
  assert.match(copy, /people interested/);
  assert.match(component, /#source-form/);
  assert.doesNotMatch(component, /Amazon Trends|TikTok|Retail Picks/);
  assert.doesNotMatch(component, /cart|checkout|inventory/i);
});

test("admin supports publish, immediate unpublish, extension, and deletion", async () => {
  const admin = await source("app/admin/source/source-weekly-admin.tsx");
  assert.match(admin, /Publish immediately for 7 days/);
  assert.match(admin, /"unpublish"/);
  assert.match(admin, /"extend"/);
  assert.match(admin, /Delete/);
  assert.match(admin, /interestCount/);
});
