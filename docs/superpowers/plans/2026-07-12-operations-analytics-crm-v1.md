# TYORA Operations Analytics and CRM V1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Merge Today and Work Orders into one admin workbench, add reliable first-party visitor reporting, and expose existing email users as a minimal customer list.

**Architecture:** Extend the existing `AnalyticsEvent`, `CommunityUser`, and unified `WorkOrder` models. A root client tracker records public page visits; the email verification route records best-effort login metadata; admin-protected APIs provide analytics, customers, and work orders to the workbench.

**Tech Stack:** Next.js 15, React 19, TypeScript, Prisma 7, PostgreSQL, Tailwind CSS.

## Global Constraints

- Preserve homepage, `/ask`, `/source`, Email Login, WhatsApp, Pricing, and Brand Film behavior.
- Do not store or expose full IP addresses.
- Analytics and customer-metadata failures must not block public browsing or valid login.
- Reuse existing AnalyticsEvent, CommunityUser, and WorkOrder models.
- Run `npm run build` before completion.

---

### Task 1: Analytics enrichment and privacy helpers

**Files:**
- Modify: `prisma/schema.prisma`
- Modify: `lib/analytics.ts`
- Modify: `lib/server/analytics-store.ts`
- Create: `scripts/operations-analytics-v1-test.mjs`

**Interfaces:**
- Consumes: analytics event POST body and Vercel request headers.
- Produces: UTM-aware source classification, city, masked IP, IP hash, daily visitor fallback key, and enriched dashboard rows.

- [ ] Write a failing static/behavior contract test for the new schema fields, source priority, masking, and dashboard types.
- [ ] Run `node scripts/operations-analytics-v1-test.mjs` and confirm it fails because the fields and helpers are absent.
- [ ] Add nullable AnalyticsEvent fields: `utmSource`, `utmMedium`, `utmCampaign`, `cityName`, `ipHash`, and `maskedIp`, with useful indexes.
- [ ] Extend browser payload with UTM values and server processing with normalized source, Vercel city, one-way IP hash, and masked IP.
- [ ] Extend the dashboard type and query result with recent unique visitor rows.
- [ ] Re-run the contract test and confirm it passes.

### Task 2: Full-site page visit tracking

**Files:**
- Create: `components/analytics-page-tracker.tsx`
- Modify: `app/layout.tsx`
- Modify: `app/home-client.tsx`
- Modify: `app/build/build-client.tsx`
- Modify: `scripts/operations-analytics-v1-test.mjs`

**Interfaces:**
- Consumes: Next.js pathname/search params and `trackAnalyticsEvent`.
- Produces: exactly one page-visit event per route transition.

- [ ] Extend the contract test to require a root tracker and reject legacy duplicate page-visit calls.
- [ ] Run the test and confirm the tracker assertion fails.
- [ ] Add a small client tracker under the root layout and remove the two manual page-visit effects.
- [ ] Re-run the test and confirm it passes.

### Task 3: Email customer metadata and admin customer API

**Files:**
- Modify: `prisma/schema.prisma`
- Modify: `lib/server/community-store.ts`
- Create: `lib/server/customer-store.ts`
- Modify: `app/api/community/auth/email/verify/route.ts`
- Create: `app/api/admin/customers/route.ts`
- Create: `scripts/customer-management-v1-test.mjs`

**Interfaces:**
- Consumes: verified CommunityUser ID and request headers.
- Produces: `recordCommunityUserLogin(userId, request)` and an admin-protected customer summary list.

- [ ] Write a failing contract test for normalized customer fields, non-blocking login metadata, activity counts, and admin protection.
- [ ] Run `node scripts/customer-management-v1-test.mjs` and confirm it fails.
- [ ] Add nullable customer metadata fields and defaults to CommunityUser.
- [ ] Implement best-effort login metadata update using shared request privacy helpers.
- [ ] Implement the admin customer query with ideas/comments/reactions counts.
- [ ] Add the admin-protected customers route.
- [ ] Re-run the contract test and confirm it passes.

### Task 4: Unified admin workbench

**Files:**
- Modify: `app/admin/page.tsx`
- Modify: `app/admin/work-orders/work-orders-admin-client.tsx`
- Modify: `app/admin/work-orders/page.tsx`
- Create: `scripts/admin-workbench-v1-test.mjs`

**Interfaces:**
- Consumes: `/api/analytics`, `/api/admin/work-orders`, and `/api/admin/customers`.
- Produces: one Workbench entry with visitor summary, Needs Reply/Replied/source filters, and a Customers tab.

- [ ] Write a failing contract test requiring one Workbench navigation entry, no separate Work Orders sidebar item, source color labels, Replied filter, and customer view.
- [ ] Run `node scripts/admin-workbench-v1-test.mjs` and confirm it fails.
- [ ] Make `/admin/work-orders` reuse the workbench client and return navigation to Workbench.
- [ ] Update the queue filters to All, Needs Reply, Replied, Community, Source, and Projects.
- [ ] Add compact visitor metrics and recent-visitor information to the workbench.
- [ ] Add a Customers admin tab backed by the protected customer API.
- [ ] Re-run the contract test and confirm it passes.

### Task 5: Database and regression verification

**Files:**
- Create: `prisma/migrations/20260712030000_add_operations_analytics_crm_v1/migration.sql`

**Interfaces:**
- Consumes: updated Prisma schema.
- Produces: additive production-safe database migration.

- [ ] Add an additive SQL migration for AnalyticsEvent and CommunityUser fields.
- [ ] Run `npx prisma generate`.
- [ ] Run all three V1 contract tests.
- [ ] Run relevant existing analytics, auth, work-order, admin, and security scripts.
- [ ] Run `npm run build` and confirm Next.js build and security scan pass.
- [ ] Inspect `git diff --check` and `git status --short`.
