# Phase 0.5 Safety Gate Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Preview email, confidential Storage, and empty-database bootstrap fail closed without touching Production or running database writes.

**Architecture:** Extract small policy modules that can be tested without Next.js or external services. Keep public CMS media unchanged, route new confidential uploads through a private bucket and admin-only signed/no-store streamed access, and isolate bootstrap credentials from repository environment configuration.

**Tech Stack:** Next.js 15, TypeScript, Node.js 24 test runner, Prisma 7, PostgreSQL `pg`, Supabase Storage REST API.

## Global Constraints

- No database writes, migrations, `db push`, seeds, cleanup, deployment, or Production changes during implementation.
- Tests must precede production code for every new behavior.
- Preview email must be allowlisted and use only the Resend test sender.
- Private Storage must never fall back to `tyora-media` or return permanent public URLs.
- Bootstrap must default to dry-run and use only `PREVIEW_DIRECT_URL` for database identity and access.

---

### Task 1: Preview email policy

**Files:**
- Create: `scripts/email-preview-safety-test.mjs`
- Create: `lib/server/email-delivery-policy.ts`
- Modify: `lib/server/email-login.ts`
- Modify: `app/api/community/auth/email/request/route.ts`

- [ ] Write behavioral tests for Vercel Preview precedence, disabled defaults, sender enforcement, and recipient allowlisting.
- [ ] Run the test and verify the expected failure.
- [ ] Implement the policy and remove sensitive logging.
- [ ] Run the test and verify it passes.

### Task 2: Private Storage policy and routes

**Files:**
- Create: `scripts/private-storage-safety-test.mjs`
- Create: `lib/server/private-storage-policy.ts`
- Create: `lib/server/private-storage.ts`
- Create: `lib/server/private-upload-request-policy.ts`
- Create: `app/api/leads/files/route.ts`
- Modify: `app/api/leads/upload/route.ts`
- Modify: `app/api/media/upload/route.ts`

- [ ] Write tests for request bounds, basic rate limiting, MIME, size, signature, filename, path, private-bucket, authenticated signed-access, caching, and public-URL rejection behavior.
- [ ] Run the test and verify the expected failure.
- [ ] Implement private upload and signed URL access without changing stored historical URLs.
- [ ] Run the test and verify it passes.

### Task 3: Preview bootstrap safety tool

**Files:**
- Create: `scripts/preview-bootstrap-safety-test.mjs`
- Create: `scripts/lib/preview-bootstrap-safety.mjs`
- Create: `scripts/bootstrap-preview-db.mjs`

- [ ] Write tests for required variables, project-ref mismatch, URL ownership, port 5432, canonical checksums, baseline fingerprint, dry-run default, and typed confirmation.
- [ ] Run the test and verify the expected failure.
- [ ] Implement pure guards and the isolated CLI without executing it.
- [ ] Run the test and verify it passes.

### Task 4: Documentation and complete verification

**Files:**
- Modify: `.env.example`
- Modify: `package.json`
- Modify: `PRODUCTION.md`

- [ ] Document exact Preview-only variables and safe secret entry.
- [ ] Run focused and existing regression tests.
- [ ] Run TypeScript, lint, production build, and security scan with non-Production values.
- [ ] Review `git diff` and staged content for secret indicators.
- [ ] Create one checkpoint commit containing Phase 0.5 only.
