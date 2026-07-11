# Operations UX Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add clear submission receipts and compact, contact-aware work-order handling.

**Architecture:** Source and Private Custom render local success states from existing POST responses. A new Prisma contact-event model provides one admin-only append-only history shared by all work-order types; the unified work-order store aggregates it into each card.

**Tech Stack:** Next.js 15, React 19, TypeScript, Prisma 7, PostgreSQL, Tailwind CSS.

## Global Constraints

- Source remains usable without login.
- Public community submissions keep their existing redirect.
- Customer-visible replies and internal contact notes must never share storage.
- No existing work-order data may be overwritten by a contact-only update.

---

### Task 1: Submission confirmations

**Files:**
- Modify: `app/source/source-client.tsx`
- Modify: `app/ask/new/new-idea-client.tsx`
- Test: `scripts/submission-confirmation-test.mjs`

- [ ] Write static regression assertions for Source receipt details and Private Custom receipt behavior.
- [ ] Run `node scripts/submission-confirmation-test.mjs` and confirm it fails because the receipt UI is absent.
- [ ] Implement Source and Private Custom success cards while retaining public redirect behavior.
- [ ] Re-run the test and confirm it passes.

### Task 2: Contact event persistence

**Files:**
- Modify: `prisma/schema.prisma`
- Modify: `lib/work-orders.ts`
- Modify: `lib/server/work-order-store.ts`
- Modify: `app/api/admin/work-orders/route.ts`
- Test: `scripts/work-order-contact-log-test.mjs`

- [ ] Write assertions for the model, validation, aggregation, and append-only API path.
- [ ] Run the test and confirm it fails because contact persistence is absent.
- [ ] Add `WorkOrderContactEvent` and expose normalized contact summaries through `WorkOrder`.
- [ ] Extend `updateWorkOrder` so contact-only updates preserve status and notes.
- [ ] Re-run the test and TypeScript checking.

### Task 3: Compact work-order UI

**Files:**
- Modify: `app/admin/work-orders/work-orders-admin-client.tsx`
- Modify: `scripts/work-orders-admin-test.mjs`

- [ ] Add failing assertions for collapsed handling, distinct reply/notes labels, and contact controls.
- [ ] Run the work-order test and confirm the new assertions fail.
- [ ] Implement the collapsed editor, latest-contact summary, and add-contact form.
- [ ] Re-run targeted and full regression suites.

### Task 4: Verify and deploy

**Files:**
- No production files.

- [ ] Run all `scripts/*test.mjs` files.
- [ ] Run `npm run build` and `git diff --check`.
- [ ] Apply the additive Prisma schema change with `npm run db:push`.
- [ ] Review the diff for data-loss, auth, and privacy issues.
- [ ] Commit, fast-forward to `main`, push, and verify production routes and UI.
