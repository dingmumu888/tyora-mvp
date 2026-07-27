import { createHmac } from "node:crypto";
import {
  Prisma,
  SubmissionRecordKind,
  SubmissionType,
  SubmissionWorkflowStatus,
  WorkflowPrivacyState
} from "@prisma/client";
import { prisma } from "@/lib/server/db";
import {
  assertValidWorkflowTransition,
  assertWorkflowPrivacyTransition,
  mapLegacyWorkflowStatus,
  normalizeSubmissionRecordKind,
  normalizeSubmissionSourceId,
  normalizeWorkflowIdempotencyKey,
  normalizeWorkflowNote,
  normalizeWorkflowStatus,
  SubmissionRecordKindValue,
  SubmissionWorkflowPolicyError,
  SubmissionWorkflowStatusValue
} from "@/lib/server/submission-workflow-policy";

type TrustedActorSnapshot = Readonly<{
  actorId: null;
  identifier: "admin:shared-session";
  label: "TYORA Admin";
}>;

type SourceContext = {
  submissionType: SubmissionType;
  legacyStatus: string;
  privacyState: WorkflowPrivacyState;
  submittedAt: Date;
  customerSnapshot: Record<string, string | null>;
  assignedOwnerId: string | null;
  ownerNeedsReview: boolean;
  publicConsentAt: Date | null;
  moderationStatus: string | null;
};

function workflowSecret() {
  const value = process.env.ADMIN_SESSION_SECRET;
  if (!value) throw new Error("Workflow protection is not configured.");
  return value;
}

function privateId(prefix: string, value: string) {
  return `${prefix}-${createHmac("sha256", workflowSecret()).update(value).digest("hex").slice(0, 40)}`;
}

function trustedAdminActor(): TrustedActorSnapshot {
  return { actorId: null, identifier: "admin:shared-session", label: "TYORA Admin" };
}

function parseJsonObject(value: string) {
  try {
    const parsed = JSON.parse(value) as unknown;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? parsed as Record<string, unknown>
      : {};
  } catch {
    return {};
  }
}

function workflowAdminDto(row: Prisma.SubmissionWorkflowGetPayload<{
  include: { assignedOwner: true; statusEvents: true; moderationVisibilityEvents: true };
}>) {
  return {
    ...row,
    estimatedOrderValueMinor: row.estimatedOrderValueMinor?.toString() ?? null,
    minimumFeeMinor: row.minimumFeeMinor?.toString() ?? null,
    finalAgreedServiceFeeMinor: row.finalAgreedServiceFeeMinor?.toString() ?? null,
    kickoffFeeMinor: row.kickoffFeeMinor?.toString() ?? null,
    customerSnapshot: parseJsonObject(row.customerSnapshotJson),
    customerSnapshotJson: undefined
  };
}

async function sourceContext(
  tx: Prisma.TransactionClient,
  recordKind: SubmissionRecordKindValue,
  sourceId: string
): Promise<SourceContext> {
  if (recordKind === "COMMUNITY_IDEA") {
    const row = await tx.communityIdea.findUnique({
      where: { id: sourceId },
      include: { author: { select: { id: true, name: true, username: true, email: true, country: true } } }
    });
    if (!row) throw new SubmissionWorkflowPolicyError("Referenced submission was not found.", 404);
    return {
      submissionType: SubmissionType.IDEA,
      legacyStatus: row.status,
      privacyState: row.visibility === "Public" ? WorkflowPrivacyState.PUBLIC : WorkflowPrivacyState.PRIVATE,
      submittedAt: row.createdAt,
      customerSnapshot: {
        communityUserId: row.author.id,
        displayName: row.author.name || row.author.username,
        email: row.author.email,
        country: row.country || row.author.country
      },
      assignedOwnerId: null,
      ownerNeedsReview: false,
      publicConsentAt: row.publicConsentAt,
      moderationStatus: row.moderationStatus
    };
  }

  if (recordKind === "CUSTOM_INQUIRY") {
    const row = await tx.customInquiry.findUnique({
      where: { id: sourceId },
      include: { user: { select: { id: true, name: true, username: true, email: true, country: true } } }
    });
    if (!row) throw new SubmissionWorkflowPolicyError("Referenced submission was not found.", 404);
    return {
      submissionType: SubmissionType.CUSTOM,
      legacyStatus: row.status,
      privacyState: WorkflowPrivacyState.PRIVATE,
      submittedAt: row.createdAt,
      customerSnapshot: {
        communityUserId: row.user.id,
        displayName: row.user.name || row.user.username,
        email: row.contactEmail || row.user.email,
        whatsapp: row.contactWhatsapp,
        targetMarket: row.targetMarket,
        country: row.user.country
      },
      assignedOwnerId: null,
      ownerNeedsReview: false,
      publicConsentAt: null,
      moderationStatus: null
    };
  }

  if (recordKind === "SOURCE_REQUEST") {
    const row = await tx.sourceRequest.findUnique({ where: { id: sourceId } });
    if (!row) throw new SubmissionWorkflowPolicyError("Referenced submission was not found.", 404);
    return {
      submissionType: SubmissionType.SOURCE,
      legacyStatus: row.status,
      privacyState: WorkflowPrivacyState.PRIVATE,
      submittedAt: row.createdAt,
      customerSnapshot: {
        email: row.email,
        whatsapp: row.whatsapp,
        destinationCountry: row.destinationCountry
      },
      assignedOwnerId: null,
      ownerNeedsReview: false,
      publicConsentAt: null,
      moderationStatus: null
    };
  }

  const row = await tx.lead.findUnique({ where: { id: sourceId } });
  if (!row) throw new SubmissionWorkflowPolicyError("Referenced submission was not found.", 404);
  const requestedOwnerId = row.ownerId && row.ownerId !== "unassigned" ? row.ownerId : null;
  const owner = requestedOwnerId
    ? await tx.teamMember.findUnique({ where: { id: requestedOwnerId }, select: { id: true } })
    : null;
  return {
    submissionType: SubmissionType.PROJECT,
    legacyStatus: row.status,
    privacyState: WorkflowPrivacyState.PRIVATE,
    submittedAt: row.submissionDate,
    customerSnapshot: {
      customerName: row.customerName,
      company: row.company,
      email: row.email,
      country: row.country
    },
    assignedOwnerId: owner?.id || null,
    ownerNeedsReview: Boolean(requestedOwnerId && !owner),
    publicConsentAt: null,
    moderationStatus: null
  };
}

async function withSerializableRetry<T>(operation: () => Promise<T>) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      const code = error && typeof error === "object" && "code" in error ? String(error.code) : "";
      if (!["P2002", "P2034"].includes(code) || attempt === 2) throw error;
    }
  }
  throw new SubmissionWorkflowPolicyError("The workflow operation could not be completed.", 409);
}

const workflowInclude = {
  assignedOwner: true,
  statusEvents: { orderBy: { createdAt: "desc" as const } },
  moderationVisibilityEvents: { orderBy: { createdAt: "desc" as const } }
};

export async function ensureSubmissionWorkflowAdmin(input: {
  recordKind: unknown;
  sourceId: unknown;
  idempotencyKey: unknown;
}) {
  const recordKind = normalizeSubmissionRecordKind(input.recordKind);
  const sourceId = normalizeSubmissionSourceId(input.sourceId);
  normalizeWorkflowIdempotencyKey(input.idempotencyKey);
  const actor = trustedAdminActor();

  return withSerializableRetry(async () => {
    const row = await prisma.$transaction(async (tx) => {
      const source = await sourceContext(tx, recordKind, sourceId);
      const existing = await tx.submissionWorkflow.findUnique({
        where: { recordKind_sourceId: { recordKind: recordKind as SubmissionRecordKind, sourceId } },
        include: workflowInclude
      });
      if (existing) return existing;

      const mapping = mapLegacyWorkflowStatus(recordKind, source.legacyStatus);
      const ownerReviewReason = source.ownerNeedsReview
        ? "Legacy Lead owner does not match an existing TeamMember."
        : null;
      const manualReviewRequired = mapping.manualReviewRequired || source.ownerNeedsReview;
      const manualReviewReason = [mapping.manualReviewReason, ownerReviewReason].filter(Boolean).join(" ") || null;
      const workflowId = privateId("SWF", `${recordKind}:${sourceId}`);
      const eventId = privateId("WSE", `${workflowId}:initial`);

      return tx.submissionWorkflow.create({
        data: {
          id: workflowId,
          recordKind: recordKind as SubmissionRecordKind,
          sourceId,
          submissionType: source.submissionType,
          qualification: mapping.qualification,
          workflowStatus: mapping.workflowStatus,
          assignedOwnerId: source.assignedOwnerId,
          customerSnapshotJson: JSON.stringify(source.customerSnapshot),
          privacyState: source.privacyState,
          legacyStatus: source.legacyStatus,
          manualReviewRequired,
          manualReviewReason,
          submittedAt: source.submittedAt,
          statusEvents: {
            create: {
              id: eventId,
              newStatus: mapping.workflowStatus,
              actorId: actor.actorId,
              actorIdentifierSnapshot: actor.identifier,
              actorLabelSnapshot: actor.label,
              note: "Workflow created from the existing submission."
            }
          }
        },
        include: workflowInclude
      });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    return workflowAdminDto(row);
  });
}

export async function transitionSubmissionWorkflowAdmin(input: {
  workflowId: unknown;
  newStatus: unknown;
  note?: unknown;
  idempotencyKey: unknown;
}) {
  const workflowId = normalizeSubmissionSourceId(input.workflowId);
  const newStatus = normalizeWorkflowStatus(input.newStatus);
  const note = normalizeWorkflowNote(input.note);
  const idempotencyKey = normalizeWorkflowIdempotencyKey(input.idempotencyKey);
  const actor = trustedAdminActor();
  const eventId = privateId("WSE", `${workflowId}:status:${idempotencyKey}`);

  return withSerializableRetry(async () => {
    const row = await prisma.$transaction(async (tx) => {
      const replay = await tx.workflowStatusEvent.findUnique({ where: { id: eventId } });
      if (replay) {
        if (replay.workflowId !== workflowId || replay.newStatus !== newStatus) {
          throw new SubmissionWorkflowPolicyError("The idempotency key was already used.", 409);
        }
        const existing = await tx.submissionWorkflow.findUnique({ where: { id: workflowId }, include: workflowInclude });
        if (!existing) throw new SubmissionWorkflowPolicyError("Workflow was not found.", 404);
        return existing;
      }

      const existing = await tx.submissionWorkflow.findUnique({ where: { id: workflowId } });
      if (!existing) throw new SubmissionWorkflowPolicyError("Workflow was not found.", 404);
      assertValidWorkflowTransition(
        existing.workflowStatus as SubmissionWorkflowStatusValue,
        newStatus
      );
      await tx.workflowStatusEvent.create({
        data: {
          id: eventId,
          workflowId,
          previousStatus: existing.workflowStatus,
          newStatus: newStatus as SubmissionWorkflowStatus,
          actorId: actor.actorId,
          actorIdentifierSnapshot: actor.identifier,
          actorLabelSnapshot: actor.label,
          note
        }
      });
      return tx.submissionWorkflow.update({
        where: { id: workflowId },
        data: {
          workflowStatus: newStatus as SubmissionWorkflowStatus,
          manualReviewRequired: false,
          manualReviewReason: null
        },
        include: workflowInclude
      });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    return workflowAdminDto(row);
  });
}

export async function changeSubmissionWorkflowPrivacyAdmin(input: {
  workflowId: unknown;
  nextState: unknown;
  privateToPublicConfirmed: unknown;
  note?: unknown;
  idempotencyKey: unknown;
}) {
  const workflowId = normalizeSubmissionSourceId(input.workflowId);
  const nextState = String(input.nextState || "").trim().toUpperCase();
  if (!(["PUBLIC", "PRIVATE"] as const).includes(nextState as "PUBLIC" | "PRIVATE")) {
    throw new SubmissionWorkflowPolicyError("Privacy state is invalid.", 400);
  }
  const confirmed = input.privateToPublicConfirmed === true;
  const note = normalizeWorkflowNote(input.note);
  const idempotencyKey = normalizeWorkflowIdempotencyKey(input.idempotencyKey);
  const actor = trustedAdminActor();
  const eventId = privateId("WME", `${workflowId}:privacy:${idempotencyKey}`);

  return withSerializableRetry(async () => {
    const row = await prisma.$transaction(async (tx) => {
      const replay = await tx.moderationVisibilityAuditEvent.findUnique({ where: { id: eventId } });
      if (replay) {
        if (replay.workflowId !== workflowId || replay.newPrivacyState !== nextState) {
          throw new SubmissionWorkflowPolicyError("The idempotency key was already used.", 409);
        }
        const existing = await tx.submissionWorkflow.findUnique({ where: { id: workflowId }, include: workflowInclude });
        if (!existing) throw new SubmissionWorkflowPolicyError("Workflow was not found.", 404);
        return existing;
      }

      const existing = await tx.submissionWorkflow.findUnique({ where: { id: workflowId } });
      if (!existing) throw new SubmissionWorkflowPolicyError("Workflow was not found.", 404);
      const source = await sourceContext(tx, existing.recordKind as SubmissionRecordKindValue, existing.sourceId);
      assertWorkflowPrivacyTransition({
        recordKind: existing.recordKind as SubmissionRecordKindValue,
        previousState: existing.privacyState,
        nextState: nextState as WorkflowPrivacyState,
        privateToPublicConfirmed: confirmed,
        publicConsentAt: source.publicConsentAt,
        moderationStatus: source.moderationStatus
      });

      if (existing.recordKind === SubmissionRecordKind.COMMUNITY_IDEA) {
        await tx.communityIdea.update({
          where: { id: existing.sourceId },
          data: { visibility: nextState === "PUBLIC" ? "Public" : "Private" }
        });
      }
      await tx.moderationVisibilityAuditEvent.create({
        data: {
          id: eventId,
          workflowId,
          action: nextState === "PUBLIC" ? "CONFIRM_PRIVATE_TO_PUBLIC" : "SET_PRIVATE",
          previousPrivacyState: existing.privacyState,
          newPrivacyState: nextState as WorkflowPrivacyState,
          privateToPublicConfirmed: nextState === "PUBLIC" && confirmed,
          actorId: actor.actorId,
          actorIdentifierSnapshot: actor.identifier,
          actorLabelSnapshot: actor.label,
          note
        }
      });
      return tx.submissionWorkflow.update({
        where: { id: workflowId },
        data: { privacyState: nextState as WorkflowPrivacyState },
        include: workflowInclude
      });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    return workflowAdminDto(row);
  });
}

export async function getSubmissionWorkflowAdmin(workflowId: string) {
  const row = await prisma.submissionWorkflow.findUnique({ where: { id: workflowId }, include: workflowInclude });
  if (!row) throw new SubmissionWorkflowPolicyError("Workflow was not found.", 404);
  return workflowAdminDto(row);
}

export async function listSubmissionWorkflowsAdmin() {
  const [rows, kpis] = await Promise.all([
    prisma.submissionWorkflow.findMany({ orderBy: { submittedAt: "desc" }, include: workflowInclude }),
    prisma.submissionWorkflow.groupBy({
      by: ["workflowStatus"],
      where: { manualReviewRequired: false },
      _count: { _all: true }
    })
  ]);
  return {
    items: rows.map(workflowAdminDto),
    kpis: Object.fromEntries(kpis.map((item) => [item.workflowStatus, item._count._all]))
  };
}
