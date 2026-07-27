import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const file = async (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("approved homepage metadata and public crawl boundaries are explicit", async () => {
  const [layout, robots, sitemap] = await Promise.all([
    file("app/layout.tsx"),
    file("app/robots.ts"),
    file("app/sitemap.ts")
  ]);

  assert.match(layout, /TYORA \| Product Development & Manufacturing in China/);
  assert.match(
    layout,
    /TYORA helps small brands develop, source, and manufacture consumer products in China with transparent factory pricing and flexible project support\./
  );
  assert.match(layout, /metadataBase: new URL\("https:\/\/www\.tyora\.io"\)/);
  assert.match(robots, /sitemap: `\$\{siteOrigin\}\/sitemap\.xml`/);

  for (const privatePath of ["/admin", "/api/", "/ask/new", "/leads", "/me"]) {
    assert.match(robots, new RegExp(privatePath.replace(/[\/]/g, "\\/")));
    assert.doesNotMatch(sitemap, new RegExp(`path: ["']${privatePath.replace(/[\/]/g, "\\/")}`));
  }

  for (const publicPath of ["/ask", "/custom", "/source", "/build", "/privacy-policy", "/terms"]) {
    assert.match(sitemap, new RegExp(`path: ["']${publicPath.replace(/[\/]/g, "\\/")}["']`));
  }
});

test("Admin, My TYORA, submission, and private Idea pages fail closed for indexing", async () => {
  const [adminLayout, myTyora, newIdea, ideaDetail, leads] = await Promise.all([
    file("app/admin/layout.tsx"),
    file("app/me/page.tsx"),
    file("app/ask/new/page.tsx"),
    file("app/ask/[slug]/page.tsx"),
    file("app/leads/page.tsx")
  ]);

  for (const source of [adminLayout, myTyora, newIdea, leads]) {
    assert.match(source, /index: false/);
    assert.match(source, /follow: false/);
  }
  assert.match(adminLayout, /noarchive: true/);
  assert.match(adminLayout, /nosnippet: true/);
  assert.match(ideaDetail, /idea\?\.visibility === "Public" && !idea\.hidden/);
  assert.match(ideaDetail, /\{ index: false, follow: false \}/);
});

test("mobile public workflows reserve the safe area and expose usable touch targets", async () => {
  const [tabs, home, ideas, ideaDetail, newIdea, custom, source, build, profile] = await Promise.all([
    file("components/mobile-bottom-tabs.tsx"),
    file("app/home-client.tsx"),
    file("app/ask/page.tsx"),
    file("app/ask/[slug]/page.tsx"),
    file("app/ask/new/new-idea-client.tsx"),
    file("app/custom/page.tsx"),
    file("app/source/source-client.tsx"),
    file("app/build/build-client.tsx"),
    file("app/me/page.tsx")
  ]);

  assert.match(tabs, /env\(safe-area-inset-bottom\)/);
  assert.match(tabs, /min-h-14/);
  assert.match(tabs, /md:hidden/);
  assert.match(home, /pb-\[calc\(8\.75rem\+env\(safe-area-inset-bottom\)\)\]/);
  for (const [name, routeSource] of Object.entries({ ideas, ideaDetail, newIdea, custom, source, build, profile })) {
    assert.match(routeSource, /pb-28/, `${name} does not reserve space for mobile navigation`);
    assert.match(routeSource, /overflow-x-hidden|min-w-0/, `${name} has no explicit horizontal-overflow containment`);
  }
});

test("homepage remains honest, image-led, and useful with an empty Preview community", async () => {
  const [home, storage, cmsImage, imageField] = await Promise.all([
    file("app/home-client.tsx"),
    file("lib/storage.ts"),
    file("components/cms-image.tsx"),
    file("components/admin/cms-image-field.tsx")
  ]);
  const combined = [home, storage].join("\n");

  assert.match(home, /communityEmptyTitle/);
  assert.match(home, /featuredCases/);
  assert.match(home, /badge=\{story\.badgeLabel\}/);
  assert.match(home, /disclosure=\{story\.projectType\}/);
  assert.match(cmsImage, /fallback/);
  assert.match(imageField, /CMS image missing/);
  assert.doesNotMatch(combined, /sample customer|fake kpi|invented customer|fabricated testimonial/i);
  assert.doesNotMatch(combined, /Idea2Product|idea2product\.co|提奥拉|提拉/);
});

test("Ideas feed keeps TYORA case fallbacks separate from community Idea records", async () => {
  const ideas = await file("app/ask/page.tsx");

  assert.match(ideas, /const country = story \? story\.country : idea\?\.country/);
  assert.match(ideas, /const imageUrl = story \? story\.coverImage\.desktopUrl : idea\?\.imageUrls\[0\]/);
  assert.doesNotMatch(ideas, /story\?\.country \|\| idea!\.country/);
});

test("public contact paths and core accessibility contracts remain present", async () => {
  const [home, custom, source, legal, sharePanel, globalCss] = await Promise.all([
    file("app/home-client.tsx"),
    file("app/custom/custom-inquiry-client.tsx"),
    file("app/source/source-client.tsx"),
    file("components/legal-page-shell.tsx"),
    file("app/ask/[slug]/idea-share-panel.tsx"),
    file("app/globals.css")
  ]);

  assert.match(home, /<h1/);
  assert.match(home, /inline-flex min-h-11 items-center gap-1\.5 text-sm font-semibold/);
  assert.match(custom, /<label/);
  assert.match(source, /<label|WhatsAppNumberInput/);
  assert.match(legal, /mailto:support@tyora\.io/);
  assert.match(sharePanel, /Facebook/);
  assert.match(sharePanel, /WhatsApp/);
  assert.match(sharePanel, /Copy link/);
  assert.match(globalCss, /:focus-visible/);
  assert.match(globalCss, /outline: 2px solid var\(--color-primary\)/);
});

test("Phase 6 files cannot introduce database writes, auth bypasses, or Production deployment operations", async () => {
  const sources = await Promise.all([
    file("app/layout.tsx"),
    file("app/admin/layout.tsx"),
    file("app/robots.ts"),
    file("app/sitemap.ts"),
    file("app/me/page.tsx"),
    file("app/ask/new/page.tsx"),
    file("app/ask/[slug]/page.tsx")
  ]);
  const combined = sources.join("\n");

  assert.doesNotMatch(combined, /prisma\.|DATABASE_URL|SUPABASE_SERVICE_ROLE_KEY|migrate|db push|seed|reset/i);
  assert.doesNotMatch(combined, /auth.?bypass|development.?login|client.?controlled.?role/i);
  assert.doesNotMatch(combined, /vercel.*prod|--prod|production deployment/i);
});
