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

export type WorkOrderContactChannel = "Email" | "WhatsApp" | "Phone" | "Other";

export type WorkOrderContactEvent = {
  id: string;
  workOrderId: string;
  channel: WorkOrderContactChannel;
  note?: string;
  contactedAt: string;
  nextFollowUpAt?: string;
  createdAt: string;
};

export type WorkOrderRecordKind = "CommunityIdea" | "CustomInquiry" | "SourceRequest" | "Lead";

export type WorkOrderDetailItem = {
  label: string;
  value: string;
};

export type WorkOrderDocument = {
  name: string;
  href: string;
  access: "Admin only" | "Owner or Admin";
};

export type WorkOrderAssessment = {
  manufacturingFeasible?: string;
  estimatedCostRange?: string;
  estimatedMoq?: string;
  assumptions?: string;
  confidence?: string;
  assessmentStatus?: string;
  disclaimer?: string;
  suggestedMaterial?: string;
  suggestedManufacturing?: string;
  moldRequirement?: string;
  mainRisks?: string;
  recommendedNextStep?: string;
  customEligible?: boolean;
};

export type WorkOrderTimelineItem = {
  id: string;
  label: string;
  detail?: string;
  actor?: string;
  createdAt: string;
  visibility: "Internal" | "Customer visible";
};

export type WorkOrder = {
  id: string;
  sourceId: string;
  actionId: string;
  type: WorkOrderType;
  recordKind?: WorkOrderRecordKind;
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
  hasReview: boolean;
  imageUrls: string[];
  tags: string[];
  internalNotes?: string;
  internalContext?: string;
  customerVisibleUpdate?: string;
  detailItems?: WorkOrderDetailItem[];
  documents?: WorkOrderDocument[];
  assessment?: WorkOrderAssessment;
  serviceMode?: string;
  feeStatus?: string;
  owner?: string;
  timeline?: WorkOrderTimelineItem[];
  contactHistory: WorkOrderContactEvent[];
  lastContactAt?: string;
  nextFollowUpAt?: string;
  lastContactChannel?: WorkOrderContactChannel;
  publicHref?: string;
  adminHref: string;
};
