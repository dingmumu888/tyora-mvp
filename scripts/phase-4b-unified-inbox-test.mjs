import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const file = async (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("unified Inbox aggregates existing records without a second data model", async () => {
  const [types, store, schema] = await Promise.all([
    file("lib/work-orders.ts"),
    file("lib/server/work-order-store.ts"),
    file("prisma/schema.prisma")
  ]);

  for (const value of ["CommunityIdea", "CustomInquiry", "SourceRequest", "Lead"]) {
    assert.match(types, new RegExp(`\\"${value}\\"`));
  }
  assert.match(store, /getAllCustomInquiriesAdmin/);
  assert.match(store, /\.\.\.ideas\.map\(communityToWorkOrder\)/);
  assert.match(store, /\.\.\.customInquiries\.map\(customInquiryToWorkOrder\)/);
  assert.match(store, /\.\.\.sourceRequests\.map\(sourceToWorkOrder\)/);
  assert.match(store, /\.\.\.leads\.map\(projectToWorkOrder\)/);
  assert.match(store, /recordKind: "CustomInquiry"/);
  assert.match(store, /recordKind: "CommunityIdea"/);
  assert.match(store, /recordKind: "SourceRequest"/);
  assert.match(store, /recordKind: "Lead"/);
  assert.equal((schema.match(/model CustomInquiry/g) || []).length, 1);
  assert.equal((schema.match(/model CommunityIdea/g) || []).length, 1);
  assert.equal((schema.match(/model Lead/g) || []).length, 1);
  assert.equal((schema.match(/model SourceRequest/g) || []).length, 1);
});

test("private documents remain behind existing owner or Admin proxy routes", async () => {
  const [store, customFileRoute, leadFileRoute, workOrderRoute] = await Promise.all([
    file("lib/server/work-order-store.ts"),
    file("app/api/community/custom/[id]/files/[index]/route.ts"),
    file("app/api/leads/files/route.ts"),
    file("app/api/admin/work-orders/route.ts")
  ]);

  assert.match(store, /\/api\/community\/custom\/\$\{encodeURIComponent\(inquiry\.id\)\}\/files\/\$\{index\}/);
  assert.match(store, /isAllowedPrivateFileAccessUrl/);
  assert.doesNotMatch(store, /privateFilesJson|objectPath|createPrivateSignedUrl/);
  assert.match(customFileRoute, /getCommunitySession/);
  assert.match(customFileRoute, /hasAdminSession/);
  assert.match(customFileRoute, /createPrivateSignedUrl\(file\.objectPath, 120\)/);
  assert.match(customFileRoute, /redirect: "error"/);
  assert.match(customFileRoute, /Cache-Control": "private, no-store"/);
  assert.match(leadFileRoute, /hasAdminSession|requireAdminSession/);
  assert.match(workOrderRoute, /requireAdminSession/);
  assert.match(workOrderRoute, /Cache-Control": "private, no-store"/);
});

test("internal and customer-visible information use separate supported fields", async () => {
  const [store, client] = await Promise.all([
    file("lib/server/work-order-store.ts"),
    file("app/admin/work-orders/work-orders-admin-client.tsx")
  ]);

  assert.match(store, /internalContext: idea\.moderationNote/);
  assert.match(store, /customerVisibleUpdate: idea\.review\?\.additionalNotes/);
  assert.match(store, /nextStep: customerVisibleUpdate/);
  assert.match(store, /internalNotes: notes/);
  assert.match(client, /Internal only\. Never shown on public pages or customer APIs/);
  assert.match(client, /Customer-visible update/);
  assert.match(client, /canEditInternalNotes/);
  assert.match(client, /canEditCustomerUpdate/);
  assert.match(client, /Qualification is not tracked as a structured field/);
  assert.match(client, /Not tracked in the current system/);
  assert.doesNotMatch(client, /sample customer|fake kpi|demo revenue|Math\.random/i);
});

test("detail workspace is accessible and responsive at desktop, tablet, and mobile widths", async () => {
  const [client, shell, page] = await Promise.all([
    file("app/admin/work-orders/work-orders-admin-client.tsx"),
    file("components/admin/admin-shell.tsx"),
    file("app/admin/work-orders/page.tsx")
  ]);

  assert.match(client, /xl:grid-cols-\[minmax\(0,1fr\)_420px\]/);
  assert.match(client, /fixed inset-0 z-50 xl:hidden/);
  assert.match(client, /w-\[min\(620px,100vw\)\]/);
  assert.match(client, /role="dialog"/);
  assert.match(client, /aria-modal="true"/);
  assert.match(client, /aria-label="Close detail workspace"/);
  assert.match(client, /focus-visible:outline/);
  assert.match(client, /min-h-11/);
  assert.match(client, /event\.key === "Escape"/);
  assert.match(client, /activeSection="inbox"/);
  assert.match(shell, /sectionId: "inbox"/);
  assert.match(page, /hasAdminSession/);
});

test("Phase 4B runtime contains no migration, auth bypass, or Production operation", async () => {
  const sources = await Promise.all([
    file("lib/work-orders.ts"),
    file("lib/server/work-order-store.ts"),
    file("app/api/admin/work-orders/route.ts"),
    file("app/admin/work-orders/work-orders-admin-client.tsx")
  ]);
  const combined = sources.join("\n");
  assert.doesNotMatch(combined, /migrate|db push|seed|reset|DATABASE_URL|SUPABASE_SERVICE_ROLE_KEY|auth.?bypass|development.?login/i);
  assert.doesNotMatch(combined, /vercel.*prod|--prod|production deployment/i);
});
