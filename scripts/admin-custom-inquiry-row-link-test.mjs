import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const file = async (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("dashboard and Inbox rows link to the exact existing Admin workspace", async () => {
  const [types, dashboard, inbox, page] = await Promise.all([
    file("lib/work-orders.ts"),
    file("components/admin/admin-dashboard.tsx"),
    file("app/admin/work-orders/work-orders-admin-client.tsx"),
    file("app/admin/work-orders/page.tsx")
  ]);

  assert.match(types, /submission: order\.sourceId/);
  assert.match(types, /order\.sourceId === submissionId/);
  assert.match(types, /order\.recordKind === target\.recordKind/);
  assert.match(dashboard, /workOrderDetailHref\(order\)/);
  assert.match(dashboard, /role="link"/);
  assert.match(dashboard, /tabIndex=\{0\}/);
  assert.match(dashboard, /cursor-pointer/);
  assert.match(dashboard, /event\.key !== "Enter" && event\.key !== " "/);
  assert.match(inbox, /router\.push\(workOrderDetailHref\(order\)/);
  assert.match(inbox, /href=\{workOrderDetailHref\(order\)\}/);
  assert.match(page, /searchParams: Promise<\{ submission\?: string; kind\?: string \}>/);
  assert.match(page, /hasAdminSession/);
});

test("private Custom detail uses real submission data and fails closed", async () => {
  const [store, inbox, adminRoute, customFileRoute] = await Promise.all([
    file("lib/server/work-order-store.ts"),
    file("app/admin/work-orders/work-orders-admin-client.tsx"),
    file("app/api/admin/work-orders/route.ts"),
    file("app/api/community/custom/[id]/files/[index]/route.ts")
  ]);

  assert.match(store, /sourceId: inquiry\.id/);
  assert.match(store, /actionId: inquiry\.id/);
  assert.match(store, /status: customStatus\(inquiry\.status\)/);
  assert.match(store, /recordKind: "CustomInquiry"/);
  assert.match(store, /documents: Array\.from\(\{ length: inquiry\.fileCount \}/);
  assert.match(inbox, /Private and confidential/);
  assert.match(inbox, /order\.documents\?\.length \|\| 0/);
  assert.match(inbox, /Submission not found/);
  assert.match(adminRoute, /requireAdminSession/);
  assert.match(customFileRoute, /hasAdminSession/);
  assert.doesNotMatch(inbox, /privateFilesJson|objectPath|SUPABASE_SERVICE_ROLE_KEY|createPrivateSignedUrl/);
});

test("hotfix adds no public detail route, schema operation, or authentication bypass", async () => {
  const sources = await Promise.all([
    file("lib/work-orders.ts"),
    file("components/admin/admin-dashboard.tsx"),
    file("app/admin/work-orders/page.tsx"),
    file("app/admin/work-orders/work-orders-admin-client.tsx")
  ]);
  const combined = sources.join("\n");

  assert.match(combined, /\/admin\/work-orders/);
  assert.doesNotMatch(combined, /migrate|db push|seed|reset|auth.?bypass|development.?login/i);
  assert.doesNotMatch(combined, /\/api\/public\/custom|\/custom\/public\/|privateFilesJson|objectPath/);
});
