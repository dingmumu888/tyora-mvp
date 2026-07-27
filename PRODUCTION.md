# TYORA Production Backend

TYORA stores CMS, pricing, founder profile, case studies, contact settings, team records, media records, and project submissions through server API routes backed by Supabase PostgreSQL. Public site media and confidential customer files use separate Supabase Storage buckets.

## Local Development

- Database: Supabase PostgreSQL via `DATABASE_URL`
- Public CMS uploads: Supabase Storage via `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `SUPABASE_STORAGE_BUCKET`
- Confidential uploads: a private bucket named by `SUPABASE_PRIVATE_STORAGE_BUCKET`
- Generate Prisma client/schema artifacts: `npm run db:generate`

`SUPABASE_STORAGE_BUCKET` is for public CMS/site images and videos only. `tyora-media` must never be used for customer designs, PDFs, quotations, contact files, or factory documents. Those files require a different, private bucket. If the private bucket variable is absent, confidential upload and access operations stop safely.

Required production environment variables:

- `DATABASE_URL`
- `ADMIN_PASSWORD`
- `ADMIN_SESSION_SECRET`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_STORAGE_BUCKET`
- `SUPABASE_PRIVATE_STORAGE_BUCKET`
- `RESEND_API_KEY`
- `RESEND_FROM` (`TYORA <login@tyora.io>`)
- `RESEND_USE_TEST_SENDER` (`false` for the verified Production sender)

Email login uses 6-digit verification codes sent through Resend. Codes expire after 10 minutes and can only be used once.

`AUTH_ORIGIN` is retained in the environment template for compatibility but is not read by the current application code.

## Preview Safety Gate

Vercel Preview is identified by `VERCEL_ENV=preview`, even though Next.js sets `NODE_ENV=production` for its optimized build. Preview email is disabled unless all of these Preview-only values are present:

- `RESEND_API_KEY`: a Preview-only Resend key
- `RESEND_FROM`: exactly `TYORA Preview <onboarding@resend.dev>`
- `RESEND_USE_TEST_SENDER`: exactly `true`
- `RESEND_PREVIEW_RECIPIENTS`: a comma-separated allowlist containing only controlled internal test inboxes

Preview refuses every recipient outside that allowlist. Keep these values absent until an internal test inbox and a dedicated Preview Resend key are ready.

If `VERCEL_ENV` is present but is not one of `production`, `preview`, or `development`, email delivery stops instead of falling back to Production behavior.

The private customer-file bucket must be created as a non-public bucket and set through `SUPABASE_PRIVATE_STORAGE_BUCKET`. The database stores only the protected TYORA access route. Authorized admin access creates a signed URL lasting no more than 120 seconds on the server, fetches it without caching, and streams the file through TYORA with `private, no-store`; the Supabase signed URL is not exposed to the browser. New confidential objects are uploaded with `no-store` cache metadata. Existing public Production file records are not moved or rewritten by this safety gate.

The public upload endpoint requires a bounded same-origin multipart request before parsing the body and applies a small process-local rate limit. That is a first safety layer, not a distributed abuse-control system; add a shared Vercel/WAF rate limit and an approved orphan-file lifecycle before high-volume public rollout. No cleanup job is added or run in this phase.

## Empty Preview Bootstrap

The guarded tool is `npm run db:preview:bootstrap`. Do not run it until database initialization is separately approved. It requires these values in the current process only:

- `TYORA_PRODUCTION_PROJECT_REF`
- `TYORA_PREVIEW_PROJECT_REF`
- `PREVIEW_SUPABASE_URL`
- `PREVIEW_DIRECT_URL`

The tool rejects matching project refs, mismatched URLs, Production references, transaction-pooler port 6543, a connection without its own password, missing TLS, schema/database overrides, and any existing relation, function, or type in the `public` schema. It defaults to a read-only dry-run. Dry-run prints a full SHA-256 fingerprint covering the generated schema and canonical migration history. Write mode additionally requires `--apply --fingerprint <the-reviewed-64-character-dry-run-fingerprint>`, an interactive terminal, and exact typed confirmation of the Preview project ref. It rechecks that the target is empty, creates the current schema from an in-memory empty-schema diff, and records every valid migration directory currently in the repository as already applied within one database transaction. Migration SQL is canonicalized to LF and `.gitattributes` enforces LF across platforms. A failure rolls back the schema and migration-history changes together. It does not use `prisma migrate deploy` and contains no test-data or Production-copy step.

After separate approval, run the dry-run first. Only if its project suffix, connection mode, object count, and fingerprint are expected may the write command be considered:

```powershell
npm run db:preview:bootstrap
npm run db:preview:bootstrap -- --apply --fingerprint <64-character-dry-run-fingerprint>
```

The current Prisma 7 runtime uses `DATABASE_URL` through `@prisma/adapter-pg`; `DIRECT_URL` is not read by the codebase. Keep the Vercel runtime on its pooler `DATABASE_URL`. Supply the 5432 direct/session connection only as `PREVIEW_DIRECT_URL` to this isolated tool. The tool temporarily maps that already-validated value to the Prisma CLI child process and blocks repository `.env` loading for that child.

To avoid chat, screenshots, shell history, and Git, open a fresh local PowerShell window and use hidden prompts. Values exist only in that process and should be removed immediately afterward:

```powershell
function Set-HiddenProcessVariable([string]$Name) {
  $value = Read-Host $Name -AsSecureString
  $credential = [pscredential]::new("temporary", $value)
  [Environment]::SetEnvironmentVariable(
    $Name,
    $credential.GetNetworkCredential().Password,
    "Process"
  )
}

$temporaryNames = @(
  "TYORA_PRODUCTION_PROJECT_REF",
  "TYORA_PREVIEW_PROJECT_REF",
  "PREVIEW_SUPABASE_URL",
  "PREVIEW_DIRECT_URL"
)

foreach ($name in $temporaryNames) { Set-HiddenProcessVariable $name }
try {
  # Run the approved command here in this same window.
} finally {
  foreach ($name in $temporaryNames) {
    Remove-Item "Env:$name" -ErrorAction SilentlyContinue
  }
}
```

Never place `PREVIEW_DIRECT_URL` in Git, chat, screenshots, command arguments, or a persistent user/system environment variable.

## API Boundary

- `GET /api/content`
- `PUT /api/content`
- `DELETE /api/content`
- `GET /api/leads`
- `POST /api/leads`
- `PUT /api/leads`
- `GET /api/media`
- `PUT /api/media`
- `POST /api/media/upload`
- `POST /api/leads/upload` (private bucket only)
- `GET /api/leads/files` (admin-only, signed and no-store streamed access)
- `GET /api/team`
- `PUT /api/team`

## Migration Path

The repository layer is isolated in `lib/server/data-store.ts`.

The current production target is Supabase/PostgreSQL. If TYORA later moves to another managed PostgreSQL provider:

1. Keep the API routes unchanged.
2. Update `DATABASE_URL`.
3. Use `prisma/schema.prisma` as the relational model reference.
4. Keep media in Supabase Storage or move it to another object storage service behind the same media asset records.
