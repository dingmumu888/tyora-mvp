# Phase 5A Workflow Schema and Migration Plan

## Scope and safety boundary

Phase 5A prepares an additive schema migration only. The migration has not been applied to Preview or Production and contains no legacy-data writes. Existing `CommunityIdea`, `CustomInquiry`, `SourceRequest`, `Lead`, `TeamMember`, and `WorkOrderContactEvent` records remain the source of truth until a separately approved Phase 5B backfill.

`WorkOrder` remains the existing server-side unified query type; it is not duplicated as a database table. `SubmissionWorkflow` is an internal workflow extension keyed by the existing record model and record ID.

## Shared workflow identity

| Existing record | `recordKind` | `submissionType` | Initial privacy |
| --- | --- | --- | --- |
| `CommunityIdea` | `COMMUNITY_IDEA` | `IDEA` | Existing `visibility` (`Public` -> `PUBLIC`, `Private` -> `PRIVATE`) |
| `CustomInquiry` | `CUSTOM_INQUIRY` | `CUSTOM` | `PRIVATE` |
| `SourceRequest` | `SOURCE_REQUEST` | `SOURCE` | `PRIVATE` |
| `Lead` | `LEAD` | `PROJECT` | `PRIVATE` |

The composite key `(recordKind, sourceId)` prevents collisions between records from different source tables. Because PostgreSQL cannot enforce a polymorphic foreign key, the Phase 5B backfill and runtime store must verify that every referenced source record exists.

## Explicit legacy-status mapping

An automatic mapping is allowed only when the old status has one unambiguous meaning. Every source status is retained in `legacyStatus`, including automatically mapped values.

| Source model | Legacy status | Proposed workflow status | Qualification | Backfill handling |
| --- | --- | --- | --- | --- |
| CommunityIdea | `Discussing` | `NEW` | `UNREVIEWED` | Automatic |
| CommunityIdea | `TYORA Reviewing` | `UNDER_REVIEW` | `UNREVIEWED` | Automatic |
| CommunityIdea | `Project Started` | `NEW` placeholder | `UNREVIEWED` | Manual review: stage is not known |
| CommunityIdea | `Manufacturing` | `PRODUCTION` | `QUALIFIED` | Automatic |
| CommunityIdea | `Shipping` | `NEW` placeholder | `QUALIFIED` | Manual review: no approved shipping status exists |
| CommunityIdea | `Completed` | `NEW` placeholder | `UNREVIEWED` | Manual review: could mean delivered or merely closed |
| CustomInquiry | `Submitted` | `NEW` | `UNREVIEWED` | Automatic |
| CustomInquiry | `In Review` | `UNDER_REVIEW` | `UNREVIEWED` | Automatic |
| CustomInquiry | `Need Information` | `UNDER_REVIEW` | `NEED_MORE_INFORMATION` | Automatic |
| CustomInquiry | `Qualified` | `QUALIFIED` | `QUALIFIED` | Automatic |
| CustomInquiry | `Closed` | `CLOSED` | `UNREVIEWED` | Automatic; no commercial outcome is inferred |
| SourceRequest | `New` | `NEW` | `UNREVIEWED` | Automatic |
| SourceRequest | `Checking Supplier` | `FACTORY_SOURCING` | `UNREVIEWED` | Automatic |
| SourceRequest | `Quoted` | `NEW` placeholder | `UNREVIEWED` | Manual review: quoting vs review sent is unknown |
| SourceRequest | `Sample Requested` | `SAMPLING` | `QUALIFIED` | Automatic |
| SourceRequest | `Factory Introduced` | `NEW` placeholder | `QUALIFIED` | Manual review: service may be delivered or ongoing |
| SourceRequest | `Managed Sourcing` | `NEW` placeholder | `QUALIFIED` | Manual review: sourcing, sampling, or production is unknown |
| SourceRequest | `Completed` | `NEW` placeholder | `UNREVIEWED` | Manual review: could mean delivered or closed |
| Lead | `New` | `NEW` | `UNREVIEWED` | Automatic |
| Lead | `Contacted` | `UNDER_REVIEW` | `UNREVIEWED` | Automatic |
| Lead | `Quoting` | `QUOTING` | `UNREVIEWED` | Automatic |
| Lead | `Sample Stage` | `SAMPLING` | `QUALIFIED` | Automatic |
| Lead | `Production` | `PRODUCTION` | `QUALIFIED` | Automatic |
| Lead | `Shipment` | `NEW` placeholder | `QUALIFIED` | Manual review: production vs delivered is unknown |
| Lead | `Completed` | `NEW` placeholder | `UNREVIEWED` | Manual review: could mean delivered or closed |
| Lead | `Lost` | `LOST` | `UNREVIEWED` | Automatic |

The `NEW` value on an ambiguous row is a neutral storage placeholder, not an inferred business state. Such rows must set `manualReviewRequired = true` and a non-empty `manualReviewReason`; Phase 5B must exclude them from stage KPIs until an Admin resolves them.

## Proposed backfill procedure for Phase 5B

1. Reconfirm that the target project is the independent Preview project and capture read-only counts for all four source tables.
2. Apply the reviewed schema migration to Preview only after separate approval.
3. In a single bounded transaction, read each source record and create at most one workflow row using `(recordKind, sourceId)`.
4. Copy the source creation timestamp into `submittedAt`, retain the old status in `legacyStatus`, and use the mapping table above.
5. Copy `Lead.ownerId` only when it matches an active or historical `TeamMember`; otherwise leave the owner null and flag manual review. Other source records begin unassigned.
6. Do not parse free-text budget or target-price strings into money. Monetary fields remain null until an Admin supplies an integer minor-unit value and ISO 4217 currency code.
7. Build a minimal internal-only customer snapshot. Do not include file URLs, object paths, signed URLs, factory data, or public DTO fields. Contact details remain private.
8. Create an initial status event with a server-derived actor snapshot identifying the migration operation. Do not invent a `TeamMember` or Admin account.
9. Verify source counts, workflow counts grouped by `recordKind`, manual-review counts, source IDs, timestamps, file references, and owner references before commit.
10. Roll back the transaction on any missing source, duplicate composite key, invalid owner, count mismatch, or privacy mismatch.

The backfill must be idempotent, must not update legacy records, and must never run against Production during Phase 5.

## Money representation

All money uses `BIGINT` minor units with a separate three-letter uppercase currency code. Percentage fees use integer basis points (`1000` = 10%). Database constraints reject negative values, invalid currency codes, missing currency for monetary values, and percentages outside 0-10000. No JavaScript floating-point value is used for money.

## Ownership, privacy, and audit design

- `assignedOwnerId` reuses `TeamMember` and remains nullable for unassigned records.
- Status and moderation events retain immutable actor identifier and label snapshots even if the optional `TeamMember` relation is later removed.
- Database triggers reject updates and deletes on both event tables.
- Private-to-public audit rows are rejected unless the action and confirmation flag explicitly record the confirmation.
- `customerSnapshotJson`, internal assessment, commercial fields, owner data, and audit events are Admin-only. Phase 5B must use dedicated private server DTOs and must not add them to public APIs.
- Existing owner/Admin checks for private files remain authoritative. This migration adds no file table, bucket, public URL, or signed-URL behavior.

## Remaining Phase 5 work

- Phase 5B: apply the reviewed migration to Preview after explicit approval, perform guarded backfill, and integrate the server-side workflow store.
- Phase 5C: connect existing Admin surfaces to persisted qualification, lifecycle, commercial, moderation, and audit operations without creating duplicate systems.
- Phase 5 security acceptance: authorization, anti-IDOR, privacy DTO, immutable audit, migration count, and log-redaction verification.
