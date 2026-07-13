# Homepage Review And Sharing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Surface concise real TYORA reviews on homepage cards, clarify idea details, and provide reliable multi-platform sharing with analytics.

**Architecture:** Keep review summarization close to the homepage card and detail page renderers, using the existing `CommunityIdea.review` structure. Add one reusable share panel inside the existing client action component and record platform choices through the existing analytics endpoint.

**Tech Stack:** Next.js 15, React 19, TypeScript, Tailwind CSS, Lucide React, existing Node source-regression scripts.

## Global Constraints

- Homepage review text is real TYORA review content, bold black, limited to two lines with an ellipsis.
- Detail review text remains complete and untruncated.
- Question chips are removed from homepage and detail display only; stored submission data remains unchanged.
- HOT moves onto the image and never occupies the timestamp row.
- Share offers Facebook, X, LinkedIn, WhatsApp, Copy Link, and More Apps without adding dependencies.
- External social likes are not claimed or inferred.

---

### Task 1: Homepage review cards

**Files:**
- Modify: `scripts/homepage-trending-showcase-test.mjs`
- Modify: `app/home-client.tsx`

**Interfaces:**
- Consumes: `CommunityIdea.review?: TyoraReview`
- Produces: `homepageReviewSummary(idea: CommunityIdea): string`

- [ ] **Step 1: Write the failing regression checks**

Add checks requiring `homepageReviewSummary`, `TYORA REVIEW`, `TYORA review pending`, `line-clamp-2`, and removal of `idea.questions[0]`; also require the HOT badge to be rendered inside the image wrapper.

- [ ] **Step 2: Run the test to verify RED**

Run: `node scripts/homepage-trending-showcase-test.mjs`

Expected: FAIL on the new homepage review checks.

- [ ] **Step 3: Implement the homepage summary and layout**

Add a summary helper that prefers `additionalNotes`, then joins non-empty feasibility, cost, MOQ, material, manufacturing, and factory values. Render the review label and summary with `line-clamp-2 font-semibold text-[#101216]`, render the pending state when empty, remove the question chip, and place `<HotBadge />` inside the image wrapper with top-left positioning.

- [ ] **Step 4: Run the test to verify GREEN**

Run: `node scripts/homepage-trending-showcase-test.mjs`

Expected: PASS.

### Task 2: Detail review clarity

**Files:**
- Modify: `scripts/idea-detail-compact-comments-test.mjs`
- Modify: `app/ask/[slug]/page.tsx`

**Interfaces:**
- Consumes: existing `expertReplyText(idea)` output
- Produces: complete, bold expert review body without question chips

- [ ] **Step 1: Write the failing detail checks**

Require `compactMeta` to contain only category and country, reject `idea.questions.slice`, and require the expert reply body to use `font-semibold text-[#101216]` without a line clamp.

- [ ] **Step 2: Run the test to verify RED**

Run: `node scripts/idea-detail-compact-comments-test.mjs`

Expected: FAIL on the new metadata and review typography checks.

- [ ] **Step 3: Implement the detail changes**

Remove question values from `compactMeta` and change the complete expert review paragraph to bold black text while preserving whitespace and the teal container.

- [ ] **Step 4: Run the test to verify GREEN**

Run: `node scripts/idea-detail-compact-comments-test.mjs`

Expected: PASS.

### Task 3: Reliable sharing and analytics

**Files:**
- Create: `scripts/idea-share-panel-test.mjs`
- Modify: `app/ask/[slug]/idea-actions.tsx`
- Modify: `lib/analytics.ts`

**Interfaces:**
- Consumes: `trackAnalyticsEvent(type, path)` and current idea title/slug
- Produces: `idea_share` analytics events and a share panel opened by both compact and full Share buttons

- [ ] **Step 1: Write the failing share checks**

Create a source regression script requiring the six share choices, Facebook/X/LinkedIn/WhatsApp composer URLs, clipboard fallback, native `navigator.share`, Escape handling, and the `idea_share` event type.

- [ ] **Step 2: Run the test to verify RED**

Run: `node scripts/idea-share-panel-test.mjs`

Expected: FAIL because the share panel and event type do not exist.

- [ ] **Step 3: Implement the share panel**

Add `shareOpen` and `shareMessage` state, platform URL builders, analytics recording, clipboard fallback, native More Apps handling, Escape/backdrop/close behavior, and one panel instance shared by both button layouts. Replace both optional native-share handlers with `setShareOpen(true)`.

- [ ] **Step 4: Add analytics support**

Append `idea_share` to `analyticsEventTypes`. Record the selected platform in the event path as `/ask/<slug>?share=<platform>`.

- [ ] **Step 5: Run the test to verify GREEN**

Run: `node scripts/idea-share-panel-test.mjs`

Expected: PASS.

### Task 4: Full verification and deployment

**Files:**
- Verify all modified files

- [ ] **Step 1: Run all source regression scripts**

Run each `scripts/*test.mjs`; expected: all PASS.

- [ ] **Step 2: Run TypeScript and production build**

Run: `npx tsc --noEmit` and `npm run build`; expected: both exit 0.

- [ ] **Step 3: Run responsive browser checks**

Verify homepage cards and an idea detail at mobile and desktop widths: no overlap, two-line homepage summary, full detail reply, and functional share panel.

- [ ] **Step 4: Commit and deploy**

Commit implementation changes, push `main`, and verify production page markers after deployment.
