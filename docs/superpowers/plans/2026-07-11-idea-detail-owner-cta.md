# Idea Detail Owner CTA Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove distracting public activity content and show a compact project-continuation CTA only to the author of an idea.

**Architecture:** Keep ownership evaluation inside the existing client-side `IdeaActions` session flow. The server-rendered detail page removes repeated activity markup, while `mode="ready"` returns no UI until ownership is confirmed and then renders one compact author-only WhatsApp link.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript, Tailwind CSS, existing Node `.mjs` regression checks.

## Global Constraints

- Do not change database schema, comments, reactions, My TYORA, or admin pages.
- Logged-out visitors and non-authors see no project-continuation block or loading placeholder.
- The idea author retains the existing WhatsApp handoff fields.
- Remove `Live Activity` only from the public idea detail page.
- Preserve Like, Interested, comments, replies, editing, and withdrawal behavior.

---

### Task 1: Define The Owner-Only Detail Contract

**Files:**
- Create: `scripts/idea-detail-owner-cta-test.mjs`
- Test: `app/ask/[slug]/page.tsx`
- Test: `app/ask/[slug]/idea-actions.tsx`

**Interfaces:**
- Consumes: existing page and `IdeaActions` source as text fixtures.
- Produces: regression command enforcing author-only rendering and removal of repeated public activity content.

- [ ] **Step 1: Write the failing test**

Create checks equivalent to:

```js
const checks = [
  ["ready action waits invisibly", actions.includes('if (mode === "ready")') && actions.includes('if (!sessionChecked || !isOwner) return null;')],
  ["compact owner CTA", actions.includes("Continue your project") && !actions.includes("Ready to build?")],
  ["handoff retained", actions.includes("Idea ID:") && actions.includes("Idea URL:") && actions.includes("Customer Name:")],
  ["live activity removed", !page.includes("Live Activity") && !page.includes("started this discussion")],
  ["discussion controls preserved", page.includes('mode="comment"') && actions.includes('react("Like")') && actions.includes('react("Interested")')]
];
```

- [ ] **Step 2: Run the test and verify RED**

Run: `node scripts/idea-detail-owner-cta-test.mjs`

Expected: FAIL because the current ready action is public and the page still renders Live Activity.

- [ ] **Step 3: Commit the failing test**

```bash
git add scripts/idea-detail-owner-cta-test.mjs
git commit -m "test: define owner-only idea continuation"
```

---

### Task 2: Implement Author-Only Continuation And Remove Activity

**Files:**
- Modify: `app/ask/[slug]/idea-actions.tsx`
- Modify: `app/ask/[slug]/page.tsx`
- Test: `scripts/idea-detail-owner-cta-test.mjs`
- Test: `scripts/idea-detail-community-layout-test.mjs`
- Test: `scripts/idea-detail-compact-comments-test.mjs`

**Interfaces:**
- Consumes: `sessionChecked`, `user`, `isOwner`, and existing `whatsappUrl` from `IdeaActions`.
- Produces: `mode="ready"` owner-only section with heading `Continue your project`.

- [ ] **Step 1: Make ready mode owner-only**

Replace the current branch with:

```tsx
if (mode === "ready") {
  if (!sessionChecked || !isOwner) return null;
  return (
    <section id="continue" className="rounded-[18px] border border-[#dfe3e8] bg-white p-4 shadow-sm shadow-[#101216]/4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold">Continue your project</h2>
          <p className="mt-1 text-sm leading-6 text-[#69707d]">Send this idea to TYORA to discuss the next manufacturing step.</p>
        </div>
        <a href={whatsappUrl} target="_blank" rel="noreferrer" className="inline-flex h-10 shrink-0 items-center justify-center rounded-full bg-[#101216] px-4 text-sm font-semibold text-white">
          Continue with TYORA →
        </a>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Remove public Live Activity markup**

Delete the final activity section from `page.tsx` and remove the now-unused `MessageCircle` import. Keep the author avatar used in the post header.

- [ ] **Step 3: Run focused tests**

Run:

```bash
node scripts/idea-detail-owner-cta-test.mjs
node scripts/idea-detail-community-layout-test.mjs
node scripts/idea-detail-compact-comments-test.mjs
```

Expected: all pass. If an existing layout test intentionally expects the removed activity section, update only that obsolete assertion while preserving its other checks.

- [ ] **Step 4: Run production build**

Run: `npm run build`

Expected: Next.js compilation, type checking, static generation, and security scan exit 0.

- [ ] **Step 5: Commit implementation**

```bash
git add app/ask/[slug]/idea-actions.tsx app/ask/[slug]/page.tsx scripts/idea-detail-owner-cta-test.mjs scripts/idea-detail-community-layout-test.mjs scripts/idea-detail-compact-comments-test.mjs
git commit -m "Refine idea detail owner actions"
```

---

### Task 3: Deploy And Verify

**Files:**
- Verify only.

**Interfaces:**
- Produces: deployed public idea detail pages without Live Activity and with an author-only continuation CTA.

- [ ] **Step 1: Push `main`**

Run: `git push origin main`

Expected: GitHub main advances and Vercel deployment starts.

- [ ] **Step 2: Verify production**

Open one public idea detail URL while logged out or as a non-author. Confirm `Ready to build?`, `Continue your project`, and `Live Activity` are absent while comments and reply controls remain. Verify the page returns HTTP 200.
