# TYORA Handoff

## Repository

- Repository: `tyora-mvp`
- Current branch: `hotfix/admin-custom-inquiry-row-link`
- Latest completed implementation commit: `453cc06b88c8bfc4f39c4d48b2f02e973d161cee`
- Phase 4C base commit: `f85ad8b011bb769a609452eef9ecbdc6270c017f`
- Preview Admin URL: <https://tyora-a6o39ffno-dingmumu888s-projects.vercel.app/admin/work-orders>
- Environment: Vercel Preview only

## Completed Scope

- Reused the existing authenticated Admin work-order workspace for Custom inquiry details.
- Added a stable detail target carrying the real Custom inquiry submission ID and record kind.
- Made Unified Inbox rows on the Dashboard and Work Orders page clickable.
- Made each submission title a real accessible link.
- Added keyboard activation with `Enter` and `Space`, visible focus styling, and pointer affordance.
- Added exact inquiry selection and a graceful Admin-only not-found state.
- Displayed the inquiry status, private/confidential indicator, and protected file count in the detail workspace.
- Preserved existing Admin authentication, server-side data access, and private-file authorization.
- Added regression coverage for Dashboard and Unified Inbox navigation.

## Changed Files

- `app/admin/work-orders/page.tsx`
- `app/admin/work-orders/work-orders-admin-client.tsx`
- `components/admin/admin-dashboard.tsx`
- `lib/work-orders.ts`
- `package.json`
- `scripts/admin-custom-inquiry-row-link-test.mjs`

This handoff document is the only file added after the implementation commit.

## Test Results

| Check | Result |
| --- | --- |
| Hotfix regression tests | Passed, 3/3 |
| Phase 4A tests | Passed, 5/5 |
| Phase 4B tests | Passed, 5/5 |
| Phase 4C tests | Passed, 6/6 |
| Phase 3B-1 security tests | Passed, 14/14 |
| Phase 3B-2 workflow tests | Passed, 11/11 |
| Safety tests | Passed, 42/42 |
| TypeScript (`npx tsc --noEmit`) | Passed |
| ESLint | Passed with 0 errors and 9 pre-existing warnings in untouched files |
| Safety lint | Passed with 0 errors and 0 warnings |
| Local production build | Passed |
| Security scan | Passed |
| Credential scan | Passed; no credentials detected in the change |
| Vercel Preview deployment | Ready on the implementation commit |

## Known Issue

The reported issue is: **the “Preview Test Product” row in Admin Unified Inbox is not clickable**.

The current hotfix implements whole-row and title-link navigation to the existing private Admin Custom inquiry workspace. Authenticated manual acceptance on the new branch-specific Preview domain is still pending, so the issue should remain open until a reviewer logs in and confirms the real `Preview Test Product` row opens the matching inquiry detail.

## Recommended Next Step

1. Sign in at the Preview Admin URL above.
2. Open Unified Inbox and activate `Preview Test Product` once by clicking the title and once by keyboard from the row.
3. Confirm the detail view opens the matching real submission ID and shows `Needs Reply`, the confidentiality indicator, submitted fields, and file count.
4. Confirm an invalid submission URL produces the safe not-found state.
5. Accept or revise this hotfix based on that Preview-only manual check. Do not merge to `main` or deploy Production without separate approval.

## Isolation Statement

- No Prisma migration or database schema change was added.
- No Preview or Production records were changed.
- No environment variables, Storage settings, domains, or email settings were changed.
- `main` and the Production deployment were not modified.
