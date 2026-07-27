export const submissionRecordKinds = [
  "COMMUNITY_IDEA",
  "CUSTOM_INQUIRY",
  "SOURCE_REQUEST",
  "LEAD"
] as const;

export const submissionWorkflowStatuses = [
  "NEW",
  "UNDER_REVIEW",
  "REVIEW_SENT",
  "QUALIFIED",
  "KICKOFF_PENDING",
  "FACTORY_SOURCING",
  "QUOTING",
  "SAMPLING",
  "PRODUCTION",
  "QUALITY_INSPECTION",
  "DELIVERED",
  "REORDER",
  "CLOSED",
  "LOST"
] as const;

export const workflowPrivacyStates = ["PUBLIC", "PRIVATE"] as const;

export type SubmissionRecordKindValue = (typeof submissionRecordKinds)[number];
export type SubmissionWorkflowStatusValue = (typeof submissionWorkflowStatuses)[number];
export type WorkflowPrivacyStateValue = (typeof workflowPrivacyStates)[number];

export type LegacyWorkflowMapping = {
  workflowStatus: SubmissionWorkflowStatusValue;
  qualification:
    | "UNREVIEWED"
    | "QUALIFIED"
    | "NEED_MORE_INFORMATION"
    | "OUT_OF_SCOPE"
    | "LOW_BUDGET"
    | "HIGH_RISK"
    | "SPAM";
  manualReviewRequired: boolean;
  manualReviewReason: string | null;
};

export class SubmissionWorkflowPolicyError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "SubmissionWorkflowPolicyError";
    this.status = status;
  }
}

const transitions: Record<SubmissionWorkflowStatusValue, readonly SubmissionWorkflowStatusValue[]> = {
  NEW: ["UNDER_REVIEW", "CLOSED", "LOST"],
  UNDER_REVIEW: ["REVIEW_SENT", "QUALIFIED", "CLOSED", "LOST"],
  REVIEW_SENT: ["UNDER_REVIEW", "QUALIFIED", "CLOSED", "LOST"],
  QUALIFIED: ["KICKOFF_PENDING", "FACTORY_SOURCING", "QUOTING", "CLOSED", "LOST"],
  KICKOFF_PENDING: ["FACTORY_SOURCING", "QUOTING", "SAMPLING", "CLOSED", "LOST"],
  FACTORY_SOURCING: ["KICKOFF_PENDING", "QUOTING", "SAMPLING", "CLOSED", "LOST"],
  QUOTING: ["KICKOFF_PENDING", "FACTORY_SOURCING", "SAMPLING", "CLOSED", "LOST"],
  SAMPLING: ["QUOTING", "PRODUCTION", "CLOSED", "LOST"],
  PRODUCTION: ["QUALITY_INSPECTION", "CLOSED", "LOST"],
  QUALITY_INSPECTION: ["PRODUCTION", "DELIVERED", "CLOSED", "LOST"],
  DELIVERED: ["REORDER", "CLOSED"],
  REORDER: ["FACTORY_SOURCING", "QUOTING", "SAMPLING", "PRODUCTION", "CLOSED", "LOST"],
  CLOSED: [],
  LOST: []
};

const automaticMappings: Partial<
  Record<SubmissionRecordKindValue, Record<string, Omit<LegacyWorkflowMapping, "manualReviewRequired" | "manualReviewReason">>>
> = {
  COMMUNITY_IDEA: {
    Discussing: { workflowStatus: "NEW", qualification: "UNREVIEWED" },
    "TYORA Reviewing": { workflowStatus: "UNDER_REVIEW", qualification: "UNREVIEWED" },
    Manufacturing: { workflowStatus: "PRODUCTION", qualification: "QUALIFIED" }
  },
  CUSTOM_INQUIRY: {
    Submitted: { workflowStatus: "NEW", qualification: "UNREVIEWED" },
    "In Review": { workflowStatus: "UNDER_REVIEW", qualification: "UNREVIEWED" },
    "Need Information": { workflowStatus: "UNDER_REVIEW", qualification: "NEED_MORE_INFORMATION" },
    Qualified: { workflowStatus: "QUALIFIED", qualification: "QUALIFIED" },
    Closed: { workflowStatus: "CLOSED", qualification: "UNREVIEWED" }
  },
  SOURCE_REQUEST: {
    New: { workflowStatus: "NEW", qualification: "UNREVIEWED" },
    "Checking Supplier": { workflowStatus: "FACTORY_SOURCING", qualification: "UNREVIEWED" },
    "Sample Requested": { workflowStatus: "SAMPLING", qualification: "QUALIFIED" }
  },
  LEAD: {
    New: { workflowStatus: "NEW", qualification: "UNREVIEWED" },
    Contacted: { workflowStatus: "UNDER_REVIEW", qualification: "UNREVIEWED" },
    Quoting: { workflowStatus: "QUOTING", qualification: "UNREVIEWED" },
    "Sample Stage": { workflowStatus: "SAMPLING", qualification: "QUALIFIED" },
    Production: { workflowStatus: "PRODUCTION", qualification: "QUALIFIED" },
    Lost: { workflowStatus: "LOST", qualification: "UNREVIEWED" }
  }
};

const ambiguousQualification: Partial<Record<SubmissionRecordKindValue, Record<string, LegacyWorkflowMapping["qualification"]>>> = {
  COMMUNITY_IDEA: { Shipping: "QUALIFIED" },
  SOURCE_REQUEST: { "Factory Introduced": "QUALIFIED", "Managed Sourcing": "QUALIFIED" },
  LEAD: { Shipment: "QUALIFIED" }
};

function normalizedText(value: unknown, label: string, maximum: number) {
  if (typeof value !== "string") {
    throw new SubmissionWorkflowPolicyError(`${label} is required.`, 400);
  }
  const normalized = value.trim();
  if (!normalized || normalized.length > maximum) {
    throw new SubmissionWorkflowPolicyError(`${label} is invalid.`, 400);
  }
  return normalized;
}

export function normalizeSubmissionRecordKind(value: unknown): SubmissionRecordKindValue {
  const normalized = normalizedText(value, "Record kind", 40).toUpperCase();
  if (!submissionRecordKinds.includes(normalized as SubmissionRecordKindValue)) {
    throw new SubmissionWorkflowPolicyError("Record kind is invalid.", 400);
  }
  return normalized as SubmissionRecordKindValue;
}

export function normalizeSubmissionSourceId(value: unknown) {
  return normalizedText(value, "Source ID", 200);
}

export function normalizeWorkflowStatus(value: unknown): SubmissionWorkflowStatusValue {
  const normalized = normalizedText(value, "Workflow status", 50).toUpperCase();
  if (!submissionWorkflowStatuses.includes(normalized as SubmissionWorkflowStatusValue)) {
    throw new SubmissionWorkflowPolicyError("Workflow status is invalid.", 400);
  }
  return normalized as SubmissionWorkflowStatusValue;
}

export function normalizeWorkflowIdempotencyKey(value: unknown) {
  const normalized = normalizedText(value, "Idempotency-Key", 160);
  if (normalized.length < 16 || !/^[a-zA-Z0-9._:-]+$/.test(normalized)) {
    throw new SubmissionWorkflowPolicyError("A valid Idempotency-Key header is required.", 400);
  }
  return normalized;
}

export function normalizeWorkflowNote(value: unknown) {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string") {
    throw new SubmissionWorkflowPolicyError("Note is invalid.", 400);
  }
  return value.trim().slice(0, 3000) || null;
}

export function assertValidWorkflowTransition(
  previousStatus: SubmissionWorkflowStatusValue,
  nextStatus: SubmissionWorkflowStatusValue
) {
  if (!transitions[previousStatus].includes(nextStatus)) {
    throw new SubmissionWorkflowPolicyError(
      `Workflow transition from ${previousStatus} to ${nextStatus} is not allowed.`,
      409
    );
  }
}

export function assertWorkflowPrivacyTransition(input: {
  recordKind: SubmissionRecordKindValue;
  previousState: WorkflowPrivacyStateValue;
  nextState: WorkflowPrivacyStateValue;
  privateToPublicConfirmed: boolean;
  publicConsentAt: Date | null;
  moderationStatus: string | null;
}) {
  if (input.previousState === input.nextState) {
    throw new SubmissionWorkflowPolicyError("Privacy state is unchanged.", 409);
  }
  if (input.nextState === "PUBLIC") {
    if (input.recordKind !== "COMMUNITY_IDEA") {
      throw new SubmissionWorkflowPolicyError("This submission type must remain private.", 409);
    }
    if (!input.privateToPublicConfirmed || !input.publicConsentAt || input.moderationStatus !== "Approved") {
      throw new SubmissionWorkflowPolicyError(
        "Private-to-public changes require recorded customer consent, approval, and explicit confirmation.",
        409
      );
    }
  }
}

export function mapLegacyWorkflowStatus(
  recordKind: SubmissionRecordKindValue,
  legacyStatus: string
): LegacyWorkflowMapping {
  const mapped = automaticMappings[recordKind]?.[legacyStatus];
  if (mapped) {
    return { ...mapped, manualReviewRequired: false, manualReviewReason: null };
  }
  return {
    workflowStatus: "NEW",
    qualification: ambiguousQualification[recordKind]?.[legacyStatus] || "UNREVIEWED",
    manualReviewRequired: true,
    manualReviewReason: `Legacy ${recordKind} status \"${legacyStatus || "(blank)"}\" requires Admin review.`
  };
}

export function workflowCountsTowardKpis(workflow: { manualReviewRequired: boolean }) {
  return !workflow.manualReviewRequired;
}
