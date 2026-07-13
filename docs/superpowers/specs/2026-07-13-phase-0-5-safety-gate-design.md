# Phase 0.5 Safety Gate Design

## Scope

Phase 0.5 adds three narrowly scoped safeguards before any Preview database bootstrap or visual redesign:

1. Vercel Preview email delivery is disabled unless a dedicated test sender, a Preview-only API key, and an explicit recipient allowlist are all present.
2. Public CMS media and confidential customer files use separate Storage buckets and URL models.
3. Preview database bootstrap tooling validates project identity and database emptiness, defaults to dry-run, and requires interactive confirmation before any write.

No deployment, database write, data migration, seed, cleanup, or Production environment change belongs to this phase.

## Email Boundary

Deployment classification gives `VERCEL_ENV` priority over `NODE_ENV`. `VERCEL_ENV=preview` is always Preview, including when `NODE_ENV=production`. A present but unknown `VERCEL_ENV` stops delivery rather than inheriting Production behavior.

Preview delivery requires all of the following:

- `RESEND_API_KEY` is present and belongs only to Preview.
- `RESEND_USE_TEST_SENDER=true`.
- `RESEND_FROM` uses `onboarding@resend.dev`.
- `RESEND_PREVIEW_RECIPIENTS` contains the normalized recipient.

The policy is evaluated before a login-code database row is created. Logs contain request IDs, stages, status codes, and safe error codes only. They never contain recipients, codes, tokens, links, API keys, provider response bodies, or raw provider headers.

## Storage Boundary

`SUPABASE_STORAGE_BUCKET` remains the public CMS/site-media bucket. Confidential project submissions require `SUPABASE_PRIVATE_STORAGE_BUCKET`; absence is an error and never falls back to the public bucket.

Private uploads accept only bounded same-origin multipart requests and validated JPG, PNG, WebP, and PDF files up to 20 MB. MIME type, extension, signature, filename, generated object path, and object-path access are validated. A small process-local limiter reduces basic abuse. New private records store an authenticated application URL, not a permanent Supabase public URL. An admin-only route creates a signed URL lasting no more than two minutes on the server and streams the file to the browser with `private, no-store`; the signed URL itself is never returned.

Existing stored public URLs are not migrated or changed in this phase.

## Bootstrap Boundary

The bootstrap tool reads only these process variables:

- `TYORA_PRODUCTION_PROJECT_REF`
- `TYORA_PREVIEW_PROJECT_REF`
- `PREVIEW_SUPABASE_URL`
- `PREVIEW_DIRECT_URL`

It never reads repository `DATABASE_URL` or dotenv files. It validates different project refs, Preview identity in both URLs, absence of the Production ref, and direct/session port 5432. It performs a read-only public-schema table count and aborts unless the count is zero.

Dry-run generates an in-memory baseline SQL summary without applying it and prints a full fingerprint covering the schema and canonicalized migration history. `--apply` additionally requires that exact fingerprint and an interactive typed Preview project-ref confirmation. Migration checksums are canonicalized to LF. The apply path uses the reviewed schema baseline and records the two existing incremental migrations as applied in the same transaction; it never uses `prisma migrate deploy`, seeds, cleanup, or Production data.

## Verification

Behavioral tests cover Preview deployment precedence, email allowlisting, private file validation, private path validation, URL identity guards, dry-run defaults, and apply confirmation. Final verification includes TypeScript, lint, a production build with a non-routable database URL, secret scanning, and a Git diff review.
