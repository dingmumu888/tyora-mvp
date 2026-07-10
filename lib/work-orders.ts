export const workOrderTypes = ["Idea", "Custom", "Source", "Project"] as const;

export const workOrderStatuses = [
  "Needs Reply",
  "New",
  "Reviewing",
  "Quoted",
  "Sample",
  "Factory Introduced",
  "Managed",
  "Production",
  "Shipping",
  "Completed",
  "Closed"
] as const;

export type WorkOrderType = (typeof workOrderTypes)[number];
export type WorkOrderStatus = (typeof workOrderStatuses)[number];

export type WorkOrder = {
  id: string;
  sourceId: string;
  type: WorkOrderType;
  status: WorkOrderStatus;
  title: string;
  description: string;
  customerName: string;
  contactEmail?: string;
  contactWhatsapp?: string;
  country: string;
  category?: string;
  quantity?: string;
  budget?: string;
  targetPrice?: string;
  submittedAt: string;
  updatedAt: string;
  needsReply: boolean;
  imageUrls: string[];
  tags: string[];
  internalNotes?: string;
  publicHref?: string;
  adminHref: string;
};
