# Phase 5B Preview Workflow Foundation

## Scope

Phase 5B applies the reviewed Phase 5A migration to the isolated Preview database, backfills one shared workflow record for every existing Idea, Custom inquiry, Source request, and Lead, and exposes the workflow through authenticated Admin-only server APIs. It does not replace the existing source models, Work Orders, CMS, Inbox, customer system, authentication, or file system.

The existing records remain the source of truth for their original content. `SubmissionWorkflow` adds qualification, workflow status, ownership, follow-up, commercial, privacy, and audit state without renaming or deleting legacy fields.

## Preview-only migration gate

The only approved Phase 5B apply path is:

```powershell
npm run db:preview:phase5b
```

The guarded workflow:

1. Accepts all target and credential values through masked local UI fields.
2. Requires distinct Production and Preview project references.
3. Requires the Preview Supabase URL and the port `5432` direct/session connection to resolve to the same Preview project and the `postgres` database.
4. Requires a locally selected Supabase CA certificate and verified PostgreSQL TLS with hostname/SNI verification.
5. Requires the exact reviewed migration name and SHA-256 checksum.
6. Allows only the known prior migration history and rejects incomplete, failed, missing, or unexpected migrations.
7. Requires an exact typed `APPLY PHASE 5B <Preview project ref>` confirmation.
8. Revalidates project isolation, migration checksum, certificate, TLS, database identity, and migration history immediately before the write.
9. Runs only `prisma migrate deploy`; it never runs `db push`, `migrate dev`, reset, seed, cleanup, or Production commands.
10. Verifies the applied migration in a read-only transaction before starting the bounded backfill.

No target, URI, username, password, certificate path/content, API key, or provider response is printed or persisted.

## Backfill mapping

Exact mappings are applied automatically. Every other status is stored with neutral workflow status `NEW`, preserves the original value in `legacyStatus`, and sets `manualReviewRequired = true` with a reason.

| Source | Legacy value | Workflow status | Qualification | Manual review |
| --- | --- | --- | --- | --- |
| Idea | Discussing | NEW | UNREVIEWED | No |
| Idea | TYORA Reviewing | UNDER_REVIEW | UNREVIEWED | No |
| Idea | Manufacturing | PRODUCTION | QUALIFIED | No |
| Custom | Submitted | NEW | UNREVIEWED | No |
| Custom | In Review | UNDER_REVIEW | UNREVIEWED | No |
| Custom | Need Information | UNDER_REVIEW | NEED_MORE_INFORMATION | No |
| Custom | Qualified | QUALIFIED | QUALIFIED | No |
| Custom | Closed | CLOSED | UNREVIEWED | No |
| Source | New | NEW | UNREVIEWED | No |
| Source | Checking Supplier | FACTORY_SOURCING | UNREVIEWED | No |
| Source | Sample Requested | SAMPLING | QUALIFIED | No |
| Lead | New | NEW | UNREVIEWED | No |
| Lead | Contacted | UNDER_REVIEW | UNREVIEWED | No |
| Lead | Quoting | QUOTING | UNREVIEWED | No |
| Lead | Sample Stage | SAMPLING | QUALIFIED | No |
| Lead | Production | PRODUCTION | QUALIFIED | No |
| Lead | Lost | LOST | UNREVIEWED | No |

Known ambiguous values retain a tentative qualification only to aid review, but remain excluded from every workflow KPI:

| Source | Ambiguous legacy value | Stored qualification | KPI eligible |
| --- | --- | --- | --- |
| Idea | Shipping | QUALIFIED | No |
| Source | Factory Introduced | QUALIFIED | No |
| Source | Managed Sourcing | QUALIFIED | No |
| Lead | Shipment | QUALIFIED | No |

An invalid legacy Lead owner is not copied into `assignedOwnerId`; the workflow remains unassigned and requires manual review. No new Admin or user identity is created.

## Backfill guarantees

- The backfill runs once inside one serializable transaction.
- Source rows are read but never updated or deleted.
- Workflow IDs and initial event IDs are deterministic.
- `(recordKind, sourceId)` is unique and inserts use conflict-safe idempotency.
- Every workflow references a source row that was read server-side.
- Missing workflows, orphaned workflows, before/after counts, mapped fields, privacy, legacy status,
  source timestamps, owner references, and initial status-event presence are verified before commit.
- Initial audit events use a trusted server-owned actor snapshot.
- Customer snapshots are assembled server-side and are available only through authenticated Admin APIs.
- Ambiguous mappings do not count toward KPIs until an Admin makes an explicit reviewed transition.

## Runtime server rules

- Every workflow endpoint calls `requireAdminSession` before reading or writing.
- Unknown server/database failures return a generic HTTP 500 message; raw provider errors are not returned.
- Workflow creation checks that the referenced source record exists in the corresponding table inside the same serializable transaction.
- Status and privacy writes require constrained idempotency keys and deterministic event IDs.
- Status changes must follow the approved transition graph.
- Status and moderation/privacy audit rows are immutable at the database layer.
- Actor identifiers and labels are created by the server. The current shared Admin session has no per-person `TeamMember` identity, so its immutable snapshot is `admin:shared-session` / `TYORA Admin` with a nullable actor relation.
- Custom inquiries, Source requests, and Leads must remain private.
- A private Idea can become public only with existing customer consent, approved moderation state, and a second explicit Admin confirmation.
- Raw customer snapshot JSON, assessment fields, commercial fields, and audit data are not added to any public DTO or public API.

## Phase boundary

Phase 5B establishes the schema on Preview, performs the guarded backfill, and provides the private server foundation. It does not add or redesign Admin workflow screens. Connecting the accepted Admin UI to these workflow APIs and resolving manually flagged rows belongs to the next separately approved phase.
