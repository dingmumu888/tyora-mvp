import { randomUUID } from "node:crypto";
import { WorkOrderContactChannel, WorkOrderContactEvent } from "@/lib/work-orders";
import { prisma } from "@/lib/server/db";

const channels: WorkOrderContactChannel[] = ["Email", "WhatsApp", "Phone", "Other"];
let contactTableReady: Promise<void> | undefined;

function ensureWorkOrderContactTable() {
  if (!contactTableReady) {
    contactTableReady = prisma.$transaction([
      prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "WorkOrderContactEvent" (
        "id" TEXT NOT NULL,
        "workOrderId" TEXT NOT NULL,
        "channel" TEXT NOT NULL,
        "note" TEXT,
        "contactedAt" TIMESTAMP(3) NOT NULL,
        "nextFollowUpAt" TIMESTAMP(3),
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "WorkOrderContactEvent_pkey" PRIMARY KEY ("id")
      )`),
      prisma.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS "WorkOrderContactEvent_workOrderId_idx" ON "WorkOrderContactEvent"("workOrderId")'),
      prisma.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS "WorkOrderContactEvent_contactedAt_idx" ON "WorkOrderContactEvent"("contactedAt")'),
      prisma.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS "WorkOrderContactEvent_nextFollowUpAt_idx" ON "WorkOrderContactEvent"("nextFollowUpAt")')
    ]).then(() => undefined).catch((error) => {
      contactTableReady = undefined;
      throw error;
    });
  }
  return contactTableReady;
}

function isMissingContactTable(error: unknown) {
  return Boolean(error && typeof error === "object" && "code" in error && (error as { code?: string }).code === "P2021");
}

function toPublic(event: { id: string; workOrderId: string; channel: string; note: string | null; contactedAt: Date; nextFollowUpAt: Date | null; createdAt: Date }): WorkOrderContactEvent {
  return {
    id: event.id,
    workOrderId: event.workOrderId,
    channel: event.channel as WorkOrderContactChannel,
    note: event.note || undefined,
    contactedAt: event.contactedAt.toISOString(),
    nextFollowUpAt: event.nextFollowUpAt?.toISOString(),
    createdAt: event.createdAt.toISOString()
  };
}

export async function getWorkOrderContactEvents(workOrderIds: string[]) {
  if (workOrderIds.length === 0) return [];
  try {
    await ensureWorkOrderContactTable();
    const events = await prisma.workOrderContactEvent.findMany({
      where: { workOrderId: { in: workOrderIds } },
      orderBy: [{ contactedAt: "desc" }, { createdAt: "desc" }]
    });
    return events.map(toPublic);
  } catch (error) {
    if (isMissingContactTable(error)) return [];
    throw error;
  }
}

export async function createWorkOrderContactEvent(workOrderId: string, input: unknown) {
  const data = input && typeof input === "object" && !Array.isArray(input) ? input as Record<string, unknown> : {};
  const channel = typeof data.channel === "string" ? data.channel as WorkOrderContactChannel : "";
  if (!channels.includes(channel as WorkOrderContactChannel)) throw new Error("Choose a valid contact channel.");
  const contactedAt = new Date(typeof data.contactedAt === "string" ? data.contactedAt : "");
  if (Number.isNaN(contactedAt.getTime())) throw new Error("Choose a valid contact time.");
  const nextFollowUpAt = typeof data.nextFollowUpAt === "string" && data.nextFollowUpAt
    ? new Date(data.nextFollowUpAt)
    : null;
  if (nextFollowUpAt && Number.isNaN(nextFollowUpAt.getTime())) throw new Error("Choose a valid follow-up time.");
  if (nextFollowUpAt && nextFollowUpAt.getTime() < contactedAt.getTime()) throw new Error("Follow-up cannot be before contact time.");
  const note = typeof data.note === "string" ? data.note.trim().slice(0, 1000) : "";
  try {
    await ensureWorkOrderContactTable();
    const event = await prisma.workOrderContactEvent.create({
      data: {
        id: randomUUID(),
        workOrderId,
        channel,
        note: note || null,
        contactedAt,
        nextFollowUpAt
      }
    });
    return toPublic(event);
  } catch (error) {
    if (isMissingContactTable(error)) throw new Error("Contact records are not ready yet. Please try again shortly.");
    throw error;
  }
}
