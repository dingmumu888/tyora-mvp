# TYORA V1 Release Candidate Acceptance

## Candidate and isolation

- Release Candidate branch: `release/v1-rc-final-acceptance`
- Accepted application baseline: `dc9af62a51c510c8cd3f802935c176144f098874`
- Existing exact-baseline Vercel deployment: Preview / Ready
- Production and `main`: read-only inspection only; no write, migration, configuration change, domain assignment, or deployment was performed.

The baseline ancestry check confirms that the candidate contains the accepted Phase 0.5, 1A, 1B, 2, 3B-1, 3B-2, 4A, 4B, 4C, 5A, 5B, and 6 commits plus the private Custom owner-detail hotfix.

## Acceptance evidence

| Area | Result | Evidence |
| --- | --- | --- |
| Ideas | Pass | Feed, honest empty state, TYORA Case disclosure, submission form, moderation and protected detail tests |
| Source | Pass | Desktop/mobile form, up to nine references, contact validation, and no-overflow checks |
| Custom | Pass with manual evidence | Private-by-default flow, owner/Admin access policy, anonymous/cross-user 404 tests, owner-detail hotfix |
| My TYORA | Pass | Anonymous boundary, owner dashboard tests, private Custom card/detail navigation |
| Admin/CMS | Pass with manual evidence | Dashboard, Unified Inbox, private inquiry detail, moderation, CMS routes and authorization |
| Authentication and email | Pass on Preview | Allowlisted Preview addresses received six-digit codes and completed login; Preview delivery remains fail-closed |
| Private files | Pass | Separate private bucket policy, no public fallback, authorized short-lived signed URL tests |
| Responsive layout | Pass | 390 mobile, 768 tablet, and 1440 desktop widths; no measured horizontal overflow or visible control obstruction |

Automated suites: 178 passed, 0 failed. Prisma validation, TypeScript, production build, security scan, credential scan, and safety lint passed. ESLint completed with 0 errors and 9 pre-existing warnings.

The files in this directory are same-commit local production-build render evidence. They use placeholder secrets and an intentionally unreachable database; no Preview or Production records were read or written. The two Admin images therefore document the honest offline failure state, not live Admin data. Live authenticated Preview Admin and private inquiry behavior were verified manually.

## Production readiness audit

Only variable names and scopes were inspected. No value was displayed or changed.

| Runtime variable | Preview scope | Production scope | Readiness |
| --- | --- | --- | --- |
| `DATABASE_URL` | Confirmed | Not visibly confirmed | Blocker |
| `ADMIN_PASSWORD` | Confirmed | Confirmed | Scope present |
| `ADMIN_SESSION_SECRET` | Confirmed | Confirmed | Scope present |
| `COMMUNITY_SESSION_SECRET` | Confirmed | Not visibly confirmed | Blocker |
| `EMAIL_LOGIN_SECRET` | Confirmed | Not visibly confirmed | Blocker |
| `ANALYTICS_HASH_SALT` | Confirmed | Not visibly confirmed | Blocker |
| `SUPABASE_URL` | Confirmed | Confirmed | Scope present |
| `SUPABASE_SERVICE_ROLE_KEY` | Confirmed | Confirmed | Scope present |
| `SUPABASE_STORAGE_BUCKET` | Confirmed | Confirmed | Scope present |
| `SUPABASE_PRIVATE_STORAGE_BUCKET` | Confirmed | Not visibly confirmed | Blocker |
| `RESEND_API_KEY` | Confirmed | Not visibly confirmed | Blocker |
| `RESEND_FROM` | Confirmed | Not visibly confirmed | Blocker |
| `RESEND_USE_TEST_SENDER` | Confirmed | Not visibly confirmed | Must be explicitly reviewed |
| `RESEND_PREVIEW_RECIPIENTS` | Confirmed | Preview-only by design | Correct scope |

Optional throttle controls use bounded defaults: `EMAIL_VERIFY_EMAIL_FAILURE_LIMIT`, `EMAIL_VERIFY_IP_FAILURE_LIMIT`, `EMAIL_VERIFY_FAILURE_WINDOW_SECONDS`, and `EMAIL_VERIFY_LOCKOUT_SECONDS`. `AUTH_ORIGIN` is not read by the current application. Migration credentials must be supplied transiently to the guarded migration process, not stored in application runtime variables.

### Production migration status

A read-only transaction against the selected Production project attempted to list `_prisma_migrations`. PostgreSQL returned `42P01` because the table does not exist. Production migration history therefore cannot be proven, and the five repository migrations must not be applied blindly.

The Supabase organization also reports egress above quota, with a grace period ending 22 July 2026. This must be resolved before release traffic or migration work.

## Release procedures

### Backup

1. Resolve the Supabase quota warning.
2. Confirm PITR/backup coverage and retention for the Production project.
3. Create an encrypted logical backup through an approved operator workflow.
4. Restore that backup into a disposable isolated project and verify schema, row counts, and private-object metadata before any Production migration.

### Migration

1. Compare the restored Production schema with every reviewed migration SQL file in an isolated environment.
2. Build and approve an explicit baseline/reconciliation plan because `_prisma_migrations` is absent; never infer history from table names alone.
3. Confirm all required Production variable scopes without revealing values.
4. In a maintenance window, use the guarded direct/session TLS connection on port 5432 and run only `prisma migrate deploy` after target, checksum, history, and backup checks pass.
5. Verify migration history and application-critical queries using read-only transactions.

### Deployment

1. Create a distinct remote RC branch and a branch-specific Vercel Preview deployment from the accepted commit.
2. Repeat authenticated smoke tests and privacy/IDOR checks on that exact deployment.
3. After migration verification, deploy the exact approved RC commit to Production without assigning any Preview resource.
4. Run read-only smoke checks for public routes, authentication, Admin entry, and private owner/Admin boundaries.

### Rollback

1. Keep the previous Vercel Production deployment available for immediate application rollback.
2. Additive schema changes are normally retained and corrected forward; do not run destructive down migrations.
3. If data integrity is compromised, stop writes, preserve forensic evidence, and restore the verified backup/PITR point into a controlled recovery workflow.
4. Re-run privacy, authentication, and migration-history checks before reopening traffic.

## Open issues and recommendation

| Severity | Issue |
| --- | --- |
| P0 | Production has no verifiable Prisma migration history table. |
| P0 | Several required Production runtime scopes are not visibly confirmed. |
| P0 | Supabase egress is over quota and the stated grace period ends 22 July 2026. |
| P1 | A distinct remote RC branch/deployment is not yet verified; the existing exact-baseline Preview is Ready. |
| P1 | Authenticated live screenshots are incomplete, although manual behavior and automated authorization tests passed. |
| P2 | Nine pre-existing ESLint warnings remain; there are no lint errors. |

**Recommendation: NO-GO for Production.** The application candidate is functionally strong in Preview, but Production must remain untouched until all P0 items and the remote RC deployment gate are resolved and re-audited.
