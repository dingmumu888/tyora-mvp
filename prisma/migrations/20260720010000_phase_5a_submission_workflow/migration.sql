CREATE TYPE "SubmissionRecordKind" AS ENUM (
  'COMMUNITY_IDEA',
  'CUSTOM_INQUIRY',
  'SOURCE_REQUEST',
  'LEAD'
);

CREATE TYPE "SubmissionType" AS ENUM (
  'IDEA',
  'CUSTOM',
  'SOURCE',
  'PROJECT'
);

CREATE TYPE "WorkflowQualification" AS ENUM (
  'UNREVIEWED',
  'QUALIFIED',
  'NEED_MORE_INFORMATION',
  'OUT_OF_SCOPE',
  'LOW_BUDGET',
  'HIGH_RISK',
  'SPAM'
);

CREATE TYPE "SubmissionWorkflowStatus" AS ENUM (
  'NEW',
  'UNDER_REVIEW',
  'REVIEW_SENT',
  'QUALIFIED',
  'KICKOFF_PENDING',
  'FACTORY_SOURCING',
  'QUOTING',
  'SAMPLING',
  'PRODUCTION',
  'QUALITY_INSPECTION',
  'DELIVERED',
  'REORDER',
  'CLOSED',
  'LOST'
);

CREATE TYPE "WorkflowServiceModel" AS ENUM (
  'FREE_ASSESSMENT',
  'SOURCE_INTRODUCTION',
  'SOURCE_MANAGED',
  'CUSTOM_INTRODUCTION',
  'CUSTOM_MANAGED',
  'REORDER_MANAGED',
  'INSPECTION_ONLY'
);

CREATE TYPE "WorkflowPaymentStatus" AS ENUM (
  'NOT_REQUIRED',
  'PENDING',
  'PAID',
  'PARTIALLY_PAID',
  'REFUNDED',
  'CANCELLED'
);

CREATE TYPE "WorkflowPrivacyState" AS ENUM ('PUBLIC', 'PRIVATE');

CREATE TYPE "ModerationVisibilityAction" AS ENUM (
  'APPROVE',
  'HIDE',
  'UNHIDE',
  'ARCHIVE',
  'RESTORE',
  'MARK_SPAM',
  'FEATURE',
  'UNFEATURE',
  'SET_PUBLIC',
  'SET_PRIVATE',
  'CONFIRM_PRIVATE_TO_PUBLIC'
);

CREATE TABLE "SubmissionWorkflow" (
  "id" TEXT NOT NULL,
  "recordKind" "SubmissionRecordKind" NOT NULL,
  "sourceId" TEXT NOT NULL,
  "submissionType" "SubmissionType" NOT NULL,
  "qualification" "WorkflowQualification" NOT NULL DEFAULT 'UNREVIEWED',
  "workflowStatus" "SubmissionWorkflowStatus" NOT NULL DEFAULT 'NEW',
  "assignedOwnerId" TEXT,
  "nextFollowUpAt" TIMESTAMP(3),
  "lastContactAt" TIMESTAMP(3),
  "productCategoryFit" TEXT,
  "budgetFit" TEXT,
  "designReadiness" TEXT,
  "targetQuantity" TEXT,
  "targetMarket" TEXT,
  "salesChannel" TEXT,
  "complianceRisk" TEXT,
  "manufacturingComplexity" TEXT,
  "internalSummary" TEXT,
  "recommendedNextStep" TEXT,
  "serviceModel" "WorkflowServiceModel",
  "paymentStatus" "WorkflowPaymentStatus" NOT NULL DEFAULT 'NOT_REQUIRED',
  "estimatedOrderValueMinor" BIGINT,
  "feePercentageBasisPoints" INTEGER,
  "minimumFeeMinor" BIGINT,
  "finalAgreedServiceFeeMinor" BIGINT,
  "kickoffFeeMinor" BIGINT,
  "currencyCode" VARCHAR(3),
  "customerSnapshotJson" TEXT NOT NULL DEFAULT '{}',
  "privacyState" "WorkflowPrivacyState" NOT NULL,
  "legacyStatus" TEXT,
  "manualReviewRequired" BOOLEAN NOT NULL DEFAULT false,
  "manualReviewReason" TEXT,
  "submittedAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "SubmissionWorkflow_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "SubmissionWorkflow_assignedOwnerId_fkey"
    FOREIGN KEY ("assignedOwnerId") REFERENCES "TeamMember"("id")
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "SubmissionWorkflow_sourceId_not_blank_check"
    CHECK (length(btrim("sourceId")) > 0),
  CONSTRAINT "SubmissionWorkflow_currency_code_check"
    CHECK ("currencyCode" IS NULL OR "currencyCode" ~ '^[A-Z]{3}$'),
  CONSTRAINT "SubmissionWorkflow_money_nonnegative_check"
    CHECK (
      ("estimatedOrderValueMinor" IS NULL OR "estimatedOrderValueMinor" >= 0) AND
      ("minimumFeeMinor" IS NULL OR "minimumFeeMinor" >= 0) AND
      ("finalAgreedServiceFeeMinor" IS NULL OR "finalAgreedServiceFeeMinor" >= 0) AND
      ("kickoffFeeMinor" IS NULL OR "kickoffFeeMinor" >= 0)
    ),
  CONSTRAINT "SubmissionWorkflow_currency_required_check"
    CHECK (
      (
        "estimatedOrderValueMinor" IS NULL AND
        "minimumFeeMinor" IS NULL AND
        "finalAgreedServiceFeeMinor" IS NULL AND
        "kickoffFeeMinor" IS NULL
      ) OR "currencyCode" IS NOT NULL
    ),
  CONSTRAINT "SubmissionWorkflow_fee_percentage_check"
    CHECK ("feePercentageBasisPoints" IS NULL OR "feePercentageBasisPoints" BETWEEN 0 AND 10000),
  CONSTRAINT "SubmissionWorkflow_customer_snapshot_json_check"
    CHECK (jsonb_typeof("customerSnapshotJson"::jsonb) = 'object'),
  CONSTRAINT "SubmissionWorkflow_manual_review_reason_check"
    CHECK (
      NOT "manualReviewRequired" OR
      NULLIF(btrim("manualReviewReason"), '') IS NOT NULL
    )
);

CREATE UNIQUE INDEX "SubmissionWorkflow_recordKind_sourceId_key"
  ON "SubmissionWorkflow"("recordKind", "sourceId");
CREATE INDEX "SubmissionWorkflow_submissionType_idx" ON "SubmissionWorkflow"("submissionType");
CREATE INDEX "SubmissionWorkflow_qualification_idx" ON "SubmissionWorkflow"("qualification");
CREATE INDEX "SubmissionWorkflow_workflowStatus_idx" ON "SubmissionWorkflow"("workflowStatus");
CREATE INDEX "SubmissionWorkflow_assignedOwnerId_idx" ON "SubmissionWorkflow"("assignedOwnerId");
CREATE INDEX "SubmissionWorkflow_nextFollowUpAt_idx" ON "SubmissionWorkflow"("nextFollowUpAt");
CREATE INDEX "SubmissionWorkflow_privacyState_idx" ON "SubmissionWorkflow"("privacyState");
CREATE INDEX "SubmissionWorkflow_submittedAt_idx" ON "SubmissionWorkflow"("submittedAt");

CREATE TABLE "WorkflowStatusEvent" (
  "id" TEXT NOT NULL,
  "workflowId" TEXT NOT NULL,
  "previousStatus" "SubmissionWorkflowStatus",
  "newStatus" "SubmissionWorkflowStatus" NOT NULL,
  "actorId" TEXT,
  "actorIdentifierSnapshot" TEXT NOT NULL,
  "actorLabelSnapshot" TEXT NOT NULL,
  "note" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "WorkflowStatusEvent_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "WorkflowStatusEvent_workflowId_fkey"
    FOREIGN KEY ("workflowId") REFERENCES "SubmissionWorkflow"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "WorkflowStatusEvent_actorId_fkey"
    FOREIGN KEY ("actorId") REFERENCES "TeamMember"("id")
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "WorkflowStatusEvent_status_change_check"
    CHECK ("previousStatus" IS NULL OR "previousStatus" <> "newStatus"),
  CONSTRAINT "WorkflowStatusEvent_actor_snapshot_check"
    CHECK (
      length(btrim("actorIdentifierSnapshot")) > 0 AND
      length(btrim("actorLabelSnapshot")) > 0
    )
);

CREATE INDEX "WorkflowStatusEvent_workflowId_createdAt_idx"
  ON "WorkflowStatusEvent"("workflowId", "createdAt");
CREATE INDEX "WorkflowStatusEvent_actorId_idx" ON "WorkflowStatusEvent"("actorId");
CREATE INDEX "WorkflowStatusEvent_newStatus_idx" ON "WorkflowStatusEvent"("newStatus");

CREATE TABLE "ModerationVisibilityAuditEvent" (
  "id" TEXT NOT NULL,
  "workflowId" TEXT NOT NULL,
  "action" "ModerationVisibilityAction" NOT NULL,
  "previousModerationStatus" TEXT,
  "newModerationStatus" TEXT,
  "previousPrivacyState" "WorkflowPrivacyState",
  "newPrivacyState" "WorkflowPrivacyState",
  "privateToPublicConfirmed" BOOLEAN NOT NULL DEFAULT false,
  "actorId" TEXT,
  "actorIdentifierSnapshot" TEXT NOT NULL,
  "actorLabelSnapshot" TEXT NOT NULL,
  "note" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "ModerationVisibilityAuditEvent_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ModerationVisibilityAuditEvent_workflowId_fkey"
    FOREIGN KEY ("workflowId") REFERENCES "SubmissionWorkflow"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "ModerationVisibilityAuditEvent_actorId_fkey"
    FOREIGN KEY ("actorId") REFERENCES "TeamMember"("id")
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "ModerationVisibilityAuditEvent_actor_snapshot_check"
    CHECK (
      length(btrim("actorIdentifierSnapshot")) > 0 AND
      length(btrim("actorLabelSnapshot")) > 0
    ),
  CONSTRAINT "ModerationVisibilityAuditEvent_private_to_public_check"
    CHECK (
      NOT (
        "previousPrivacyState" = 'PRIVATE' AND
        "newPrivacyState" = 'PUBLIC'
      ) OR (
        "action" = 'CONFIRM_PRIVATE_TO_PUBLIC' AND
        "privateToPublicConfirmed" = true
      )
    )
);

CREATE INDEX "ModerationVisibilityAuditEvent_workflowId_createdAt_idx"
  ON "ModerationVisibilityAuditEvent"("workflowId", "createdAt");
CREATE INDEX "ModerationVisibilityAuditEvent_actorId_idx"
  ON "ModerationVisibilityAuditEvent"("actorId");
CREATE INDEX "ModerationVisibilityAuditEvent_action_idx"
  ON "ModerationVisibilityAuditEvent"("action");

CREATE FUNCTION "reject_submission_workflow_event_mutation"()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'Submission workflow audit events are immutable';
END;
$$;

CREATE TRIGGER "WorkflowStatusEvent_immutable"
  BEFORE UPDATE OR DELETE ON "WorkflowStatusEvent"
  FOR EACH ROW EXECUTE FUNCTION "reject_submission_workflow_event_mutation"();

CREATE TRIGGER "ModerationVisibilityAuditEvent_immutable"
  BEFORE UPDATE OR DELETE ON "ModerationVisibilityAuditEvent"
  FOR EACH ROW EXECUTE FUNCTION "reject_submission_workflow_event_mutation"();
