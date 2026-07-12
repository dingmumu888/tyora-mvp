# Notifications And Private Review Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Clear notification badges when Messages is opened, route private custom reviews to WhatsApp, and make `/ask/new` public-only.

**Architecture:** Reuse the existing notification read API and browser event for global badge synchronization. Reuse one centralized WhatsApp URL helper for private review CTAs. Simplify the existing idea form instead of creating another private form.

**Tech Stack:** Next.js 15, React 19, TypeScript, source-based Node regression tests.

## Global Constraints

- Do not add a second custom-review form.
- Private custom projects go to WhatsApp with a prefilled English message.
- Public idea submissions always use `visibility: "Public"`.
- Notification badges clear only after the read API succeeds.

---

### Task 1: Message Read Synchronization

**Files:**
- Modify: `app/me/activity-messages.tsx`
- Modify: `scripts/my-tyora-messages-test.mjs`

- [ ] Add a failing regression assertion that opening Messages posts to `/api/community/notifications/read`, updates local unread state, and dispatches `tyora:community-notifications-read`.
- [ ] Run `node scripts/my-tyora-messages-test.mjs` and confirm it fails for the missing open-handler behavior.
- [ ] Add local unread state and an async `openMessages` handler that marks messages read before clearing all badges.
- [ ] Run the focused test and confirm it passes.

### Task 2: WhatsApp Private Review Path

**Files:**
- Modify: `lib/whatsapp.ts`
- Modify: `app/custom/page.tsx`
- Modify: `app/source/source-client.tsx`
- Modify: `scripts/custom-positioning-test.mjs`
- Modify: `scripts/customer-paths-p0-test.mjs`

- [ ] Add failing assertions for a prefilled private-review WhatsApp URL and both private CTAs using it.
- [ ] Run the focused tests and confirm they fail.
- [ ] Export `PRIVATE_CUSTOM_REVIEW_WHATSAPP_URL` from the centralized helper.
- [ ] Change Custom and Source private-review CTAs to anchors using that URL; retain the public idea link and email fallback.
- [ ] Run the focused tests and confirm they pass.

### Task 3: Public-Only Idea Form

**Files:**
- Modify: `app/ask/new/new-idea-client.tsx`
- Modify: `scripts/customer-paths-p0-test.mjs`
- Modify: `scripts/submission-confirmation-test.mjs`

- [ ] Add failing assertions that the form has no private selector/copy and submits `visibility: "Public"`.
- [ ] Run the focused tests and confirm they fail.
- [ ] Remove private-mode state, selector UI, receipt branches, and explanatory copy while keeping public publishing behavior.
- [ ] Run the focused tests and confirm they pass.

### Task 4: Verification And Deployment

**Files:**
- Verify all modified files.

- [ ] Run every `scripts/*test.mjs` test and require zero failures.
- [ ] Run `npx tsc --noEmit --incremental false`.
- [ ] Run `npx next build` and `node scripts/security-scan.mjs`.
- [ ] Check `/me`, `/custom`, `/source`, and `/ask/new` at desktop and 390px mobile widths.
- [ ] Commit, push `main`, and verify the new public assets on `https://www.tyora.io`.
