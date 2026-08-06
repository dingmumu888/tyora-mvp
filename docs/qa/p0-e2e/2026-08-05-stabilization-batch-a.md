# TYORA P0 stabilization batch A

- Date: 2026-08-05
- Status: Preview deployed; founder cross-role retest in progress
- Environment: Local verification followed by a new Vercel Preview deployment; no Production deployment
- Goal: Restore a trustworthy creator-to-TYORA operating loop before continuing broad feature testing
- Source evidence: `2026-08-05-founder-pilot.md`

## Implementation checkpoint

- Local production build, security scan, existing community tests, i18n tests, and the dedicated Batch A regression suite pass.
- The reviewed Preview schema changes were applied, then the guard safely stopped because the historical Phase 5B backfill was incorrectly invoked a second time against workflows that had since changed during testing. The runner now executes that legacy backfill only when the workflow foundation is first created. A guarded rerun is required to verify migration history and report completion. No Production migration or deployment was attempted.
- Manual acceptance remains required on a fresh Vercel Preview before this batch can be marked passed.

## Founder manual retest ledger

Every modified customer-facing or employee-facing behavior must pass again on Preview through the real role sequence; automated checks alone do not close an item.

| Retest area | Related issues | Required roles | Status |
|---|---|---|---|
| Refreshed community-feed thumbnails | `P0-E2E-011` | Visitor: full refresh → detail → browser Back | Passed by founder, 2026-08-06 |
| Authentication before discussion creation, commenting, and replying, including immediate logout synchronization | `P0-E2E-032`, `033` | Logged-out visitor → email login → creator draft/comment/reply → logout without refresh → login-resumed reply | Implemented locally; automated checks passed; fresh Preview founder retest pending |
| Permanent deletion and atomic Posts count/list | `P0-E2E-002`, `029`, `030` | Creator → visitor → Admin | Not retested |
| Lifecycle/visibility and complete Admin queues | `P0-E2E-027`, `028`, `031` | Creator → visitor → Admin | Not retested |
| Private creator follow-up and idempotent send | `P0-E2E-025`, `026` | Creator → Admin → visitor | Next retest |
| TYORA reply and notification automatic refresh | `P0-E2E-017` | Admin → already-open creator tab | Not retested |
| Stable timestamps and ordering | `P0-E2E-031` | Creator → public → Admin | Not retested |

## Why testing pauses here

The current build cannot provide a stable test baseline because a destructive action reports success without persistence, the same submission has contradictory owner/visitor/Admin states, customer follow-up is blocked, and counters/timestamps can disagree. Continuing into Likes, I'd Buy, comments, sharing, and reporting would create ambiguous downstream findings.

## Product rules frozen for this batch

1. Public community ideas publish immediately and are readable by logged-out visitors unless TYORA later takes a clearly recorded moderation action.
2. A follow-up sent from the private My TYORA Messages experience is private between the creator and authorized TYORA staff. A creator who wants to post publicly must use the separate community discussion composer.
3. Owner `Delete` means permanent deletion. It is not withdrawal, hiding, or soft deletion. The idea and defined dependent customer content/files must not remain recoverable through owner, public, Admin, API, or storage access.
4. Owner, visitor, and Admin interfaces must derive status and access from one lifecycle policy. A record may not be Public/Discussing to its owner while Pending/Hidden in Admin and 404 to visitors.
5. My TYORA counters and their opened lists must use the same server definition. A successful mutation updates both atomically.
6. Relative age and default ordering use a stable creation timestamp. Updated, moderated, and last-activity times are separate, explicitly labelled values.
7. New TYORA replies and notification indicators update without a full-page reload through focus revalidation plus a lightweight visible-page refresh strategy. Drafts, scroll, and active overlays must remain intact.
8. Logged-out visitors may read public ideas, images, and published TYORA replies. Starting a discussion and posting a comment or reply require email login before the protected action begins. After authentication, return the user to the intended action; preserve any existing draft if a session expires mid-flow.
9. Login and logout state changes apply immediately to every already-open community surface. Logout removes owner-only actions and hides protected composers without requiring refresh; a later login resumes the user's intended action without duplicate submission.

## In-scope fixes and acceptance criteria

### A. Permanent deletion and atomic Posts state

Issues: `P0-E2E-002`, `P0-E2E-029`, `P0-E2E-030`

- Replace the native confirmation with a localized TYORA dialog that says permanent and irreversible, names the idea, and uses explicit `Permanently delete` / `Cancel` actions.
- Cancel closes safely and changes no record, counter, timestamp, or ordering.
- Only the owner or an authorized Admin can delete.
- Confirmed deletion completes on the server before the card disappears. Failure keeps the card visible, preserves state, and shows a localized actionable error.
- Repeated clicks, timeout retry, and replay of the same request produce one deletion result and no duplicate side effects.
- Success removes the idea and its defined dependent public/private idea media, comments, reactions, TYORA assessment display, and notifications according to the permanent-delete rule.
- Without refresh, the owner list and Posts counter both decrement once.
- After refresh, a new session, and direct URL entry, the record remains absent.
- Admin All/search and the public API no longer return the record; associated storage URLs no longer resolve.

### B. One lifecycle and visibility policy

Issue: `P0-E2E-027`

- A newly published Public idea is immediately readable by logged-out visitors and appears consistently as Public/Discussing to owner and Admin.
- If Admin hides, returns, or removes an idea, the owner sees the exact state, reason, date, and next available action; the page must not continue to say Public/Discussing.
- Hidden or returned records never appear in public feeds or anonymous detail access.
- Legacy Pending/Hidden Preview records are migrated or explicitly resolved so they cannot masquerade as current public discussions.
- Access tests cover owner, another signed-in member, logged-out visitor, and Admin.

### C. Complete Admin moderation queues

Issue: `P0-E2E-028`

- Add an explicit actionable Pending/Hidden moderation bucket or another clearly named bucket that contains every such record.
- `All` equals the sum of mutually exclusive lifecycle buckets, or the interface clearly presents and explains any separate non-actionable category.
- Pending items show creator, age/SLA, reason, and available approve/return/remove actions.
- Search finds the record regardless of the selected summary bucket and identifies its true state.
- No submission can exist only in All while being absent from every employee work queue.

### D. Private creator follow-up with safe submission

Issues: `P0-E2E-025`, `P0-E2E-026`

- Beside the field and send action, state in the selected language that the follow-up is private to the creator and authorized TYORA staff.
- The follow-up is stored and displayed only in the private conversation; it never becomes a public comment or public counter event.
- The client automatically generates a valid idempotency key for one send intent, reuses it for safe retries, and creates a new key only after success or a materially new message.
- Rapid double click, timeout/retry, refresh/reopen, and duplicate response handling create exactly one follow-up and one Admin notification.
- While sending, duplicate actions are disabled. On failure, the draft remains and a localized customer-facing error replaces raw infrastructure text.
- Admin receives the full message in the correct private queue; the creator can reopen the thread and see one persisted copy.

### E. Reply and notification automatic refresh

Issue: `P0-E2E-017`

- When Admin publishes a TYORA assessment, an already-open creator tab updates the assessment and unread state without manual refresh.
- Revalidation occurs immediately when the tab regains focus and, while visible, within a short target of 15 seconds.
- The update changes only reply/notification data: it must not reload the page, erase a draft, close an overlay, move scroll position, or reset an image viewer.
- Header dot, My TYORA unread count, event state, and assessment content agree in the same render and remain correct after refresh/new session.
- A visible localized fallback lets the creator retry if automatic refresh fails.

### F. Stable timestamps and ordering

Issue: `P0-E2E-031`

- The same record displays the same creation age on owner, public, and Admin surfaces within normal rounding tolerance.
- Failed, cancelled, duplicate, or no-op actions do not change creation time or default creation order.
- If a view orders by last activity rather than creation, it labels that rule and exposes the corresponding timestamp.
- Created, Updated, Moderated, and Last activity remain separate fields and are tested independently.

### G. Authentication before creator actions

Issues: `P0-E2E-032`, `P0-E2E-033`

- Logged-out visitors can open the community feed, public idea detail, images, and published TYORA replies without authentication.
- Selecting `Start a Discussion` requests email login before the discussion form accepts product text or images.
- Selecting the public comment composer or a comment `Reply` action requests email login before accepting text.
- Successful authentication returns the creator to the intended discussion, comment, or reply action without sending duplicate requests.
- Logging out from an already-open detail page immediately removes owner-only Edit, Withdraw, and Delete controls and replaces comment/reply entry points with email login, without a refresh.
- If Reply triggered authentication, successful login opens the inline reply field for the exact selected comment without requiring a second click.
- If an authenticated session expires after work begins, the existing draft-recovery path remains available and image-upload errors do not force the creator to rebuild the draft.
- English, Simplified Chinese, Spanish, French, German, and Portuguese explain the same access rule.

## Required automated verification

- Authorization and anonymous-access policy tests for every lifecycle state.
- Permanent-delete transaction and dependent-record/storage cleanup tests.
- Delete and follow-up idempotency tests, including duplicate and timeout retry.
- Counter/list consistency and cache invalidation tests.
- Admin bucket completeness and total reconciliation tests.
- Timestamp immutability and ordering tests.
- Focus/visible-tab revalidation tests that preserve drafts and local UI state.
- Existing security, i18n, lint, and production build checks must remain green.

## Preview acceptance journey

Use one clearly named E2E creator and clean Preview-only data after the fixes:

1. Creator publishes one Public idea.
2. Logged-out visitor opens the direct URL successfully.
3. Admin sees it in exactly one actionable queue and publishes one TYORA assessment.
4. The creator's already-open tab receives the assessment and unread indicator automatically.
5. Creator sends one non-sensitive private follow-up; Admin receives exactly one copy and public comments/counters remain unchanged.
6. Creator permanently deletes the idea.
7. Owner Posts count/list become zero without refresh and remain zero after refresh/new session.
8. Visitor URL is 404, Admin All/search no longer returns the idea, and associated test media is inaccessible.
9. Timestamps and ordering remain stable through cancel, retry, reply, and deletion attempts.

Batch A passes only when all nine steps pass with no manual database repair or browser refresh workaround.

## Explicitly deferred until the baseline passes

- Helpful, I'd Buy, comments, sharing, reporting, feed filters, and remaining visitor exploration.
- Minor layout, lightbox, image-loading, upload-limit, emoji/country, and estimated-time fixes.
- Full authenticated-menu, legal-page, and Admin localization cleanup.
- Notification drawer information architecture and other non-blocking UX refinements.
- Public/private monetization experiments and payment implementation.
- Production deployment.

The email allowlist remains acceptable only for Preview testing. Open public email delivery is still a separate Production release gate.

## Risk and rollback boundary

- Highest risk: destructive database/storage behavior and authorization.
- All implementation and migrations must be exercised against Preview data first; no Production data cleanup is authorized by this batch.
- Keep changes separately reviewable. If Preview validation fails, roll back the application deployment and restore the Preview database from its pre-migration backup rather than weakening deletion or visibility rules.
