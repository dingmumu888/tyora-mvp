import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";

const file = async (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

async function dashboardModule() {
  const source = await file("lib/admin-dashboard.ts");
  const output = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022
    }
  }).outputText;
  return import(`data:text/javascript;base64,${Buffer.from(output).toString("base64")}`);
}

function workOrder(overrides = {}) {
  return {
    id: "idea-test",
    sourceId: "IDEA-TEST",
    actionId: "test",
    type: "Idea",
    status: "New",
    title: "Synthetic test idea",
    description: "Synthetic test description",
    customerName: "Synthetic Customer",
    country: "Test Country",
    submittedAt: "2026-07-17T01:00:00.000Z",
    updatedAt: "2026-07-17T01:00:00.000Z",
    needsReply: false,
    hasReview: false,
    imageUrls: [],
    tags: [],
    contactHistory: [],
    adminHref: "/admin/community",
    ...overrides
  };
}

test("dashboard metrics use real work-order state and keep qualification explicitly unavailable", async () => {
  const { createAdminDashboardSnapshot } = await dashboardModule();
  const snapshot = createAdminDashboardSnapshot([
    workOrder({ id: "new", status: "New" }),
    workOrder({ id: "reply", status: "Needs Reply", needsReply: true }),
    workOrder({ id: "production", status: "Production" })
  ], new Date("2026-07-17T12:00:00.000Z"));

  const values = Object.fromEntries(snapshot.metrics.map((metric) => [metric.id, metric]));
  assert.equal(values["new-submissions"].value, 2);
  assert.equal(values["waiting-review"].value, 1);
  assert.equal(values["in-production"].value, 1);
  assert.equal(values["qualified-leads"].value, 0);
  assert.equal(values["qualified-leads"].available, false);
  assert.match(values["qualified-leads"].note, /not tracked/i);
});

test("only the latest scheduled contact can create an overdue follow-up", async () => {
  const { createAdminDashboardSnapshot } = await dashboardModule();
  const now = new Date("2026-07-17T12:00:00.000Z");
  const unresolved = workOrder({
    id: "overdue",
    contactHistory: [{
      id: "event-a",
      workOrderId: "overdue",
      channel: "Email",
      contactedAt: "2026-07-16T08:00:00.000Z",
      nextFollowUpAt: "2026-07-17T08:00:00.000Z",
      createdAt: "2026-07-16T08:00:00.000Z"
    }]
  });
  const resolved = workOrder({
    id: "resolved",
    contactHistory: [
      {
        id: "event-new",
        workOrderId: "resolved",
        channel: "Email",
        contactedAt: "2026-07-17T10:00:00.000Z",
        createdAt: "2026-07-17T10:00:00.000Z"
      },
      {
        id: "event-old",
        workOrderId: "resolved",
        channel: "Email",
        contactedAt: "2026-07-15T10:00:00.000Z",
        nextFollowUpAt: "2026-07-16T10:00:00.000Z",
        createdAt: "2026-07-15T10:00:00.000Z"
      }
    ]
  });
  const snapshot = createAdminDashboardSnapshot([unresolved, resolved], now);
  assert.deepEqual(snapshot.followUps.map((item) => item.order.id), ["overdue"]);
  assert.equal(snapshot.metrics.find((metric) => metric.id === "overdue-follow-ups").value, 1);
});

test("pipeline groups existing statuses without mutating or inventing records", async () => {
  const { createAdminDashboardSnapshot } = await dashboardModule();
  const orders = [
    workOrder({ id: "review", status: "Reviewing" }),
    workOrder({ id: "sample", status: "Sample" }),
    workOrder({ id: "managed", status: "Managed" }),
    workOrder({ id: "done", status: "Completed" }),
    workOrder({ id: "closed", status: "Closed" })
  ];
  const snapshot = createAdminDashboardSnapshot(orders, new Date("2026-07-17T12:00:00.000Z"));
  assert.deepEqual(snapshot.pipeline.map((column) => column.orders.map((order) => order.id)), [
    ["review"],
    ["sample"],
    ["managed"],
    ["done"]
  ]);
  assert.equal(snapshot.inbox.length, orders.length);
});

test("admin shell and dashboard preserve navigation, privacy, responsive behavior, and honest empty states", async () => {
  const [shell, dashboard, page, route, communityLink] = await Promise.all([
    file("components/admin/admin-shell.tsx"),
    file("components/admin/admin-dashboard.tsx"),
    file("app/admin/page.tsx"),
    file("app/api/admin/work-orders/route.ts"),
    file("components/admin-view-community-link.tsx")
  ]);
  for (const label of [
    "Dashboard",
    "Inbox",
    "Ideas Moderation",
    "Projects",
    "Customers",
    "Cases",
    "Pricing",
    "Website Content",
    "Media",
    "Team & Settings"
  ]) assert.match(shell, new RegExp(label));

  assert.match(shell, /w-\[220px\]/);
  assert.match(shell, /lg:pl-\[220px\]/);
  assert.match(shell, /aria-label="Open navigation"/);
  assert.match(shell, /aria-label="Close navigation overlay"/);
  assert.match(shell, /Search admin sections and submissions/);
  assert.match(shell, /New Project/);
  assert.match(shell, /AdminViewCommunityLink className="hidden xl:inline-flex"/);
  assert.match(communityLink, /className = "inline-flex"/);
  assert.doesNotMatch(communityLink, /className=\{`inline-flex h-10/);
  assert.match(dashboard, /No submissions yet/);
  assert.match(dashboard, /No fallback or sample records are shown/);
  assert.match(dashboard, /md:hidden/);
  assert.match(dashboard, /hidden overflow-x-auto md:block/);
  assert.match(page, /fetch\("\/api\/admin\/work-orders"/);
  assert.match(route, /requireAdminSession/);
  assert.doesNotMatch([shell, dashboard].join("\n"), /sample customer|demo revenue|fake kpi|Math\.random/i);
});

test("Phase 4A runtime does not introduce schema, migration, authentication bypass, or Production operations", async () => {
  const sources = await Promise.all([
    file("components/admin/admin-shell.tsx"),
    file("components/admin/admin-dashboard.tsx"),
    file("lib/admin-dashboard.ts"),
    file("app/admin/page.tsx")
  ]);
  const combined = sources.join("\n");
  assert.doesNotMatch(combined, /prisma\.|DATABASE_URL|SUPABASE_|migrate|db push|seed|auth.?bypass|development.?login/i);
  assert.doesNotMatch(sources.slice(0, 3).join("\n"), /resend|email.?login/i);
});
