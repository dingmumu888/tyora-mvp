# TYORA Customer Paths P0 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Ideas, Source, and Custom consistent and safe across mobile and desktop without changing backend schemas.

**Architecture:** Reuse the existing `/ask/new` form and community API for both public and private projects. Add a query-driven visibility default for Custom, keep Source independent, and update shared navigation/search contracts around these three paths.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript, existing Node `.mjs` source-contract tests.

## Global Constraints

- No new dependencies.
- Keep `/build` as a compatibility route.
- Preserve complete uploaded product images.
- Do not change pricing or backend data schemas.

---

### Task 1: Customer-path regression contract

**Files:**
- Create: `scripts/customer-paths-p0-test.mjs`

**Interfaces:**
- Consumes: existing page/component source files.
- Produces: one executable regression contract for this batch.

- [ ] **Step 1: Write the failing test** covering per-idea homepage links, mobile visibility controls, Custom private CTA, Custom mobile navigation, non-cropping image processing, Custom search entry, working Source anchors, and removed Pricing nav.
- [ ] **Step 2: Run `node scripts/customer-paths-p0-test.mjs`** and confirm each missing behavior fails for the expected reason.
- [ ] **Step 3: Commit the failing contract** with `git commit -m "test: define customer path fixes"`.

### Task 2: Correct navigation and destinations

**Files:**
- Modify: `app/home-client.tsx`
- Modify: `components/mobile-bottom-tabs.tsx`
- Modify: `components/site-search.tsx`
- Modify: `app/source/source-client.tsx`

**Interfaces:**
- Consumes: idea `slug`, existing `/custom`, and Source sections.
- Produces: exact detail links and consistent Ideas / Source / Custom navigation.

- [ ] **Step 1: Change featured cards to `/ask/${idea.slug}` and remove desktop Pricing navigation.**
- [ ] **Step 2: Change the mobile Build tab to Custom and include `/custom` in visible mobile routes.**
- [ ] **Step 3: Add Custom to search and add `id="pricing"` and `id="service-protection"` to Source sections.**
- [ ] **Step 4: Run `node scripts/customer-paths-p0-test.mjs`** and confirm navigation checks pass.
- [ ] **Step 5: Commit** with `git commit -m "fix: align customer path navigation"`.

### Task 3: Safe private Custom submission

**Files:**
- Modify: `app/custom/page.tsx`
- Modify: `app/ask/new/new-idea-client.tsx`
- Modify: `app/ask/new/page.tsx` if query propagation is server-owned.

**Interfaces:**
- Consumes: `?visibility=private` query parameter.
- Produces: form state initialized to `visibility: "Private"` and mobile visibility controls.

- [ ] **Step 1: Point the Custom CTA to `/ask/new?visibility=private`.**
- [ ] **Step 2: Initialize the idea form from the query parameter without changing the API payload shape.**
- [ ] **Step 3: Add a compact Public / Private segmented choice to the mobile quick-post form.**
- [ ] **Step 4: Run `node scripts/customer-paths-p0-test.mjs`** and confirm private-flow checks pass.
- [ ] **Step 5: Commit** with `git commit -m "feat: add safe private custom submission"`.

### Task 4: Preserve uploaded image composition

**Files:**
- Modify: `app/ask/new/new-idea-client.tsx`

**Interfaces:**
- Consumes: browser `File` images.
- Produces: maximum 1600px proportional JPEG data URLs without square cropping.

- [ ] **Step 1: Replace square source cropping with proportional resize dimensions.**
- [ ] **Step 2: Update upload copy from auto-cropped to resized while preserving proportions.**
- [ ] **Step 3: Run `node scripts/customer-paths-p0-test.mjs` and `node scripts/multi-image-upload-test.mjs`.**
- [ ] **Step 4: Commit** with `git commit -m "fix: preserve idea image proportions"`.

### Task 5: Full regression and deployment

**Files:**
- Modify obsolete test assertions only when they contradict the approved product behavior.

**Interfaces:**
- Consumes: all scripts and production build.
- Produces: deployable `main` changes.

- [ ] **Step 1: Run all `scripts/*test.mjs` tests and resolve product-regression failures.**
- [ ] **Step 2: Run `npm run build` and confirm security scan passes.**
- [ ] **Step 3: Merge the feature branch into `main`, push, and verify deployed route contracts.**

