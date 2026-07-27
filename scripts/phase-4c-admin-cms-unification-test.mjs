import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const file = async (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("Phase 4C uses one shared Admin shell across the existing CMS and operational queues", async () => {
  const [shell, ui, admin, community, source] = await Promise.all([
    file("components/admin/admin-shell.tsx"),
    file("components/admin/admin-ui.tsx"),
    file("app/admin/page.tsx"),
    file("app/admin/community/community-admin-client.tsx"),
    file("app/admin/source/source-admin-client.tsx")
  ]);

  for (const label of [
    "Ideas Moderation",
    "Projects",
    "Customers",
    "Cases",
    "Pricing",
    "Website Content",
    "Media",
    "Source",
    "Analytics",
    "Team & Settings"
  ]) assert.match(shell, new RegExp(label.replace(/[&]/g, "\\&")));

  assert.match(shell, /w-\[220px\]/);
  assert.match(shell, /sectionId: "community"/);
  assert.match(shell, /sectionId: "sourceQueue"/);
  assert.match(admin, /<AdminShell/);
  assert.match(community, /<AdminShell/);
  assert.match(community, /activeSection="community"/);
  assert.match(source, /<AdminShell/);
  assert.match(source, /activeSection="sourceQueue"/);
  assert.match(ui, /rounded-md border border-\[#e4e7ec\]/);
  assert.match(ui, /focus-visible:ring-4/);
});

test("Ideas moderation keeps the existing publication, assessment, ordering, and settings contracts", async () => {
  const community = await file("app/admin/community/community-admin-client.tsx");

  assert.match(community, /fetch\("\/api\/admin\/community"\)/);
  assert.match(community, /fetch\("\/api\/content"\)/);
  assert.match(community, /method: "PATCH"/);
  assert.match(community, /method: "DELETE"/);
  for (const field of [
    "moderationStatus",
    "assessmentStatus",
    "manufacturingFeasible",
    "estimatedCostRange",
    "estimatedMoq",
    "assumptions",
    "confidence",
    "customEligible",
    "disclaimer",
    "homepageFeatured",
    "homepageFeaturedOrder"
  ]) assert.match(community, new RegExp(field));
  assert.match(community, /Community Settings/);
  assert.match(community, /assessmentLabels/);
  assert.match(community, /assessmentDisclaimer/);
});

test("Source operations preserve the existing request, status, notes, filter, and delete contracts", async () => {
  const source = await file("app/admin/source/source-admin-client.tsx");

  assert.match(source, /fetch\("\/api\/source", \{ cache: "no-store" \}\)/);
  assert.match(source, /method: "PATCH"/);
  assert.match(source, /method: "DELETE"/);
  assert.match(source, /name="status"/);
  assert.match(source, /name="internalNotes"/);
  assert.match(source, /sourceStatuses/);
  assert.match(source, /setFilter/);
  assert.match(source, /setQuery/);
  assert.match(source, /No source requests found/);
});

test("existing CMS editability remains connected to the same content, media, team, and case models", async () => {
  const [admin, homepage, imageField] = await Promise.all([
    file("app/admin/page.tsx"),
    file("components/admin/homepage-content-editor.tsx"),
    file("components/admin/cms-image-field.tsx")
  ]);

  for (const contract of [
    "saveContent",
    "saveMedia",
    "saveTeamMembers",
    "HomepageContentEditor",
    "CaseStudiesEditor",
    "PricingEditor",
    "CustomersSection",
    "CeoDashboardSection",
    "TeamSettings"
  ]) assert.match(admin, new RegExp(contract));

  for (const editable of [
    "navigationLinks",
    "campaigns",
    "categories",
    "paths",
    "communityMinimumScore",
    "communityLimit",
    "caseLimit",
    "primaryCtaText",
    "secondaryCtaText",
    "visible",
    "order"
  ]) assert.match(homepage, new RegExp(editable));
  assert.match(homepage, /CmsImageField/);
  assert.match(imageField, /onUpload/);
  assert.match(imageField, /onChange/);
  assert.match(admin, /story\.featured/);
  assert.match(admin, /story\.projectType/);
  assert.match(admin, /story\.badgeLabel/);
  assert.match(admin, /plan\.visible/);
  assert.match(admin, /plan\.order/);
});

test("Admin CMS surfaces expose honest empty states and responsive, accessible controls", async () => {
  const [shell, ui, admin, community, source] = await Promise.all([
    file("components/admin/admin-shell.tsx"),
    file("components/admin/admin-ui.tsx"),
    file("app/admin/page.tsx"),
    file("app/admin/community/community-admin-client.tsx"),
    file("app/admin/source/source-admin-client.tsx")
  ]);
  const combined = [ui, admin, community, source].join("\n");

  assert.match(shell, /aria-label="Open navigation"/);
  assert.match(shell, /aria-label="Close navigation overlay"/);
  assert.match(shell, /lg:pl-\[220px\]/);
  assert.match(combined, /min-h-11/);
  assert.match(combined, /focus-visible|focus-within/);
  assert.match(combined, /overflow-x-auto/);
  assert.match(ui, /cn\("min-w-0", title \|\| description \|\| actions/);
  assert.match(admin, /No team members/);
  assert.match(admin, /No case studies/);
  assert.match(admin, /No pricing plans/);
  assert.match(admin, /No customers found/);
  assert.match(source, /No source requests found/);
  assert.match(community, /No posts in this section/);
  assert.doesNotMatch(combined, /sample customer|demo revenue|fake kpi|invented customer/i);
});

test("Phase 4C UI does not introduce schema, migration, auth bypass, or Production operations", async () => {
  const sources = await Promise.all([
    file("components/admin/admin-ui.tsx"),
    file("components/admin/admin-shell.tsx"),
    file("app/admin/page.tsx"),
    file("app/admin/community/community-admin-client.tsx"),
    file("app/admin/source/source-admin-client.tsx")
  ]);
  const combined = sources.join("\n");

  assert.doesNotMatch(combined, /prisma\.|DATABASE_URL|SUPABASE_SERVICE_ROLE_KEY|migrate|db push|seed|reset/i);
  assert.doesNotMatch(combined, /auth.?bypass|development.?login|client.?controlled.?role/i);
  assert.doesNotMatch(combined, /vercel.*prod|--prod|production deployment/i);
});
