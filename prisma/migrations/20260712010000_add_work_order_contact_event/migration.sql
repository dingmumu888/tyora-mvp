CREATE TABLE IF NOT EXISTS "WorkOrderContactEvent" (
    "id" TEXT NOT NULL,
    "workOrderId" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "note" TEXT,
    "contactedAt" TIMESTAMP(3) NOT NULL,
    "nextFollowUpAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkOrderContactEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "WorkOrderContactEvent_workOrderId_idx" ON "WorkOrderContactEvent"("workOrderId");
CREATE INDEX IF NOT EXISTS "WorkOrderContactEvent_contactedAt_idx" ON "WorkOrderContactEvent"("contactedAt");
CREATE INDEX IF NOT EXISTS "WorkOrderContactEvent_nextFollowUpAt_idx" ON "WorkOrderContactEvent"("nextFollowUpAt");
