import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("root temporarily redirects visitors to the Ideas community", async () => {
  const rootPage = await read("app/page.tsx");

  assert.match(rootPage, /import \{ redirect \} from "next\/navigation"/);
  assert.match(rootPage, /redirect\("\/ask"\)/);
  assert.doesNotMatch(rootPage, /permanentRedirect/);
  assert.doesNotMatch(rootPage, /HomeClient/);
});

test("the previous homepage remains available at /about", async () => {
  const aboutPage = await read("app/about/page.tsx");

  assert.match(aboutPage, /import HomeClient from "\.\.\/home-client"/);
  assert.match(aboutPage, /canonical: "\/about"/);
  assert.match(aboutPage, /<HomeClient \/>/);
});

test("community is the primary indexed entry and logo stays in Ideas", async () => {
  const [sitemap, askPage] = await Promise.all([
    read("app/sitemap.ts"),
    read("app/ask/page.tsx")
  ]);

  assert.match(sitemap, /\{ path: "\/ask", changeFrequency: "daily", priority: 1 \}/);
  assert.match(sitemap, /\{ path: "\/about", changeFrequency: "monthly", priority: 0\.6 \}/);
  assert.doesNotMatch(sitemap, /\{ path: "\/",/);
  assert.match(askPage, /<Link href="\/ask"[^>]+aria-label=\{`\$\{content\.brandName\} ideas`\}>/);
});

test("a clean installation starts with no fabricated community case cards", async () => {
  const [storage, i18n, askPage, admin, dataStore] = await Promise.all([
    read("lib/storage.ts"),
    read("lib/i18n.ts"),
    read("app/ask/page.tsx"),
    read("app/admin/page.tsx"),
    read("lib/server/data-store.ts")
  ]);

  assert.match(storage, /cases: \[\]\n};/);
  assert.doesNotMatch(storage, /id: "magnetic-phone-stand"/);
  assert.doesNotMatch(storage, /id: "capybara-night-light"/);
  assert.doesNotMatch(storage, /id: "pet-grooming-tool"/);
  assert.match(i18n, /cases: \[\]\n};/);
  assert.match(askPage, /<StarterCommunityState \/>/);
  assert.doesNotMatch(admin, /defaultContent\.cases\[0\]\.coverImage/);
  assert.match(dataStore, /function withoutDemonstrationCases/);
  assert.match(dataStore, /projectType !== "Demonstration Project"/);
  assert.match(dataStore, /sanitized\.removedCount > 0/);
  assert.match(dataStore, /prisma\.siteContent\.update/);
});
