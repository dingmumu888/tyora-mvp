import { CommunityIdea, CommunityStatus, CustomInquiry, CustomInquiryStatus, TyoraReview } from "@/lib/community";
import { Lead, LeadStatus } from "@/lib/storage";
import { SourceRequest, SourceStatus } from "@/lib/source";
import { WorkOrder, WorkOrderContactEvent, WorkOrderDetailItem, WorkOrderStatus, workOrderStatuses } from "@/lib/work-orders";
import { getCommunityIdeas, updateCommunityIdeaAdmin } from "@/lib/server/community-store";
import { getAllCustomInquiriesAdmin, updateCustomInquiryAdmin } from "@/lib/server/custom-inquiry-store";
import { getLeads, updateLead } from "@/lib/server/data-store";
import { isAllowedPrivateFileAccessUrl } from "@/lib/server/private-storage-policy";
import { getSourceRequests, updateSourceRequest } from "@/lib/server/source-store";
import { createWorkOrderContactEvent, getWorkOrderContactEvents } from "@/lib/server/work-order-contact-store";

function detailItems(items: Array<[string, string | undefined]>): WorkOrderDetailItem[] {
  return items
    .filter((item): item is [string, string] => Boolean(item[1]?.trim()))
    .map(([label, value]) => ({ label, value }));
}

function assessment(review?: Partial<TyoraReview>) {
  if (!review) return undefined;
  return {
    manufacturingFeasible: review.manufacturingFeasible,
    estimatedCostRange: review.estimatedCostRange,
    estimatedMoq: review.estimatedMoq,
    assumptions: review.assumptions,
    confidence: review.confidence,
    assessmentStatus: review.assessmentStatus,
    disclaimer: review.disclaimer,
    suggestedMaterial: review.suggestedMaterial,
    suggestedManufacturing: review.suggestedManufacturing,
    moldRequirement: review.moldRequirement,
    mainRisks: review.mainRisks,
    recommendedNextStep: review.recommendedNextStep,
    customEligible: review.customEligible
  };
}

function communityStatus(status: CommunityStatus, needsReply: boolean, hidden: boolean): WorkOrderStatus {
  if (hidden) return "Closed";
  if (needsReply) return "Needs Reply";
  if (status === "TYORA Reviewing") return "Reviewing";
  if (status === "Project Started") return "Managed";
  if (status === "Manufacturing") return "Production";
  if (status === "Shipping") return "Shipping";
  if (status === "Completed") return "Completed";
  return "Reviewing";
}

function sourceStatus(status: SourceStatus): WorkOrderStatus {
  if (status === "Checking Supplier") return "Reviewing";
  if (status === "Quoted") return "Quoted";
  if (status === "Sample Requested") return "Sample";
  if (status === "Factory Introduced") return "Factory Introduced";
  if (status === "Managed Sourcing") return "Managed";
  if (status === "Completed") return "Completed";
  return "New";
}

function projectStatus(status: LeadStatus): WorkOrderStatus {
  if (status === "Contacted") return "Reviewing";
  if (status === "Quoting") return "Quoted";
  if (status === "Sample Stage") return "Sample";
  if (status === "Production") return "Production";
  if (status === "Shipment") return "Shipping";
  if (status === "Completed") return "Completed";
  if (status === "Lost") return "Closed";
  return "New";
}

function communityToWorkOrder(idea: CommunityIdea): WorkOrder {
  const needsReply = !idea.review && !idea.hidden;
  const type = idea.visibility === "Private" ? "Custom" : "Idea";
  return {
    id: `${type.toLowerCase()}-${idea.id}`,
    sourceId: idea.id,
    actionId: idea.slug,
    type,
    recordKind: "CommunityIdea",
    status: communityStatus(idea.status, needsReply, idea.hidden),
    title: idea.title,
    description: idea.description,
    customerName: idea.author.name || idea.author.username,
    country: idea.country || idea.author.country || "Not specified",
    category: idea.category,
    submittedAt: idea.createdAt,
    updatedAt: idea.updatedAt,
    needsReply,
    hasReview: Boolean(idea.review),
    contactHistory: [],
    imageUrls: idea.imageUrls,
    tags: [
      idea.visibility,
      idea.status,
      ...idea.questions,
      idea.pinned ? "Pinned" : "",
      idea.homepageFeatured ? "Homepage" : ""
    ].filter(Boolean),
    internalContext: idea.moderationNote,
    customerVisibleUpdate: idea.review?.additionalNotes,
    detailItems: detailItems([
      ["Visibility", idea.visibility],
      ["Moderation", idea.moderationStatus],
      ["Community status", idea.status],
      ["Questions", idea.questions.join(", ")]
    ]),
    assessment: assessment(idea.review),
    serviceMode: idea.visibility === "Private" ? "Private Idea review" : "Public Idea review",
    timeline: [
      { id: `${idea.id}-submitted`, label: "Idea submitted", createdAt: idea.createdAt, visibility: "Customer visible" as const },
      ...(idea.moderatedAt ? [{ id: `${idea.id}-moderated`, label: `Moderation: ${idea.moderationStatus}`, createdAt: idea.moderatedAt, visibility: "Internal" as const }] : []),
      ...(idea.review?.publishedAt ? [{ id: `${idea.id}-assessment`, label: "TYORA assessment published", createdAt: idea.review.publishedAt, visibility: "Customer visible" as const }] : [])
    ],
    publicHref: idea.visibility === "Public" ? `/ask/${idea.slug}` : undefined,
    adminHref: "/admin/community"
  };
}

function customStatus(status: string): WorkOrderStatus {
  if (status === "Submitted" || status === "Need Information") return "Needs Reply";
  if (status === "In Review") return "Reviewing";
  if (status === "Qualified") return "Managed";
  if (status === "Closed") return "Closed";
  return "New";
}

function customInquiryToWorkOrder(inquiry: CustomInquiry): WorkOrder {
  return {
    id: `custom-inquiry-${inquiry.id}`,
    sourceId: inquiry.id,
    actionId: inquiry.id,
    type: "Custom",
    recordKind: "CustomInquiry",
    status: customStatus(inquiry.status),
    title: inquiry.productName || "Private Custom inquiry",
    description: inquiry.productDescription,
    customerName: inquiry.contactEmail || inquiry.contactWhatsapp || "Private Custom customer",
    contactEmail: inquiry.contactEmail,
    contactWhatsapp: inquiry.contactWhatsapp,
    country: inquiry.targetMarket || "Not specified",
    category: inquiry.category,
    quantity: inquiry.quantity,
    budget: inquiry.budget,
    submittedAt: inquiry.createdAt,
    updatedAt: inquiry.updatedAt,
    needsReply: inquiry.status === "Submitted" || inquiry.status === "Need Information",
    hasReview: Boolean(inquiry.assessmentSnapshot?.assessmentStatus),
    contactHistory: [],
    imageUrls: [],
    tags: [inquiry.status, inquiry.ideaId ? "From Idea" : "Direct Custom", inquiry.timeline].filter(Boolean),
    customerVisibleUpdate: inquiry.nextStep,
    detailItems: detailItems([
      ["Target market", inquiry.targetMarket],
      ["Timeline", inquiry.timeline],
      ["Linked Idea", inquiry.ideaSnapshot?.title || inquiry.ideaId],
      ["Original assessment", inquiry.assessmentSnapshot?.assessmentStatus]
    ]),
    documents: Array.from({ length: inquiry.fileCount }, (_, index) => ({
      name: `Private file ${index + 1}`,
      href: `/api/community/custom/${encodeURIComponent(inquiry.id)}/files/${index}`,
      access: "Owner or Admin" as const
    })),
    assessment: assessment(inquiry.assessmentSnapshot),
    serviceMode: "Private Custom",
    timeline: [
      { id: `${inquiry.id}-submitted`, label: "Custom inquiry submitted", createdAt: inquiry.createdAt, visibility: "Customer visible" },
      ...(inquiry.updatedAt !== inquiry.createdAt ? [{ id: `${inquiry.id}-updated`, label: `Custom status: ${inquiry.status}`, createdAt: inquiry.updatedAt, visibility: "Customer visible" as const }] : [])
    ],
    adminHref: "/admin/custom-inquiries"
  };
}

function sourceToWorkOrder(request: SourceRequest): WorkOrder {
  return {
    id: `source-${request.id}`,
    sourceId: request.id,
    actionId: request.id,
    type: "Source",
    recordKind: "SourceRequest",
    status: sourceStatus(request.status),
    title: request.productName,
    description: request.description,
    customerName: request.email || request.whatsapp || "Source buyer",
    contactEmail: request.email,
    contactWhatsapp: request.whatsapp,
    country: request.destinationCountry,
    category: request.material,
    quantity: request.quantity,
    targetPrice: request.targetPrice,
    submittedAt: request.createdAt,
    updatedAt: request.updatedAt,
    needsReply: ["New", "Checking Supplier"].includes(request.status),
    hasReview: false,
    contactHistory: [],
    imageUrls: request.imageUrls && request.imageUrls.length > 0 ? request.imageUrls : request.imageUrl ? [request.imageUrl] : [],
    tags: [request.status, ...request.needTypes, request.material || ""].filter(Boolean),
    internalNotes: request.internalNotes,
    detailItems: detailItems([
      ["Material", request.material],
      ["Product link", request.productLink],
      ["Requested help", request.needTypes.join(", ")]
    ]),
    serviceMode: request.needTypes.join(", ") || "Source review",
    timeline: [
      { id: `${request.id}-submitted`, label: "Source request submitted", createdAt: request.createdAt, visibility: "Customer visible" },
      ...(request.updatedAt !== request.createdAt ? [{ id: `${request.id}-updated`, label: `Source status: ${request.status}`, createdAt: request.updatedAt, visibility: "Internal" as const }] : [])
    ],
    publicHref: request.productLink,
    adminHref: "/admin/source"
  };
}

function projectToWorkOrder(lead: Lead): WorkOrder {
  const storedFiles = (lead.uploadedFiles?.length ? lead.uploadedFiles : lead.uploadedFile ? [lead.uploadedFile] : [])
    .filter((href) => isAllowedPrivateFileAccessUrl(href));
  return {
    id: `project-${lead.id}`,
    sourceId: lead.id,
    actionId: lead.id,
    type: "Project",
    recordKind: "Lead",
    status: projectStatus(lead.status),
    title: lead.productIdea || "Project submission",
    description: lead.additionalRequirements || lead.productIdea,
    customerName: lead.customerName || lead.company || lead.email || "Project customer",
    contactEmail: lead.email,
    country: lead.country || "Not specified",
    category: lead.category || lead.designType,
    quantity: lead.quantity,
    budget: lead.budget,
    submittedAt: lead.submissionDate,
    updatedAt: lead.statusHistory?.[0]?.createdAt || lead.submissionDate,
    needsReply: ["New", "Contacted", "Quoting"].includes(lead.status),
    hasReview: false,
    contactHistory: [],
    imageUrls: storedFiles.filter((href) => /(?:jpg|jpeg|png|webp)(?:$|%|&)/i.test(href)),
    tags: [lead.status, lead.priority || "Medium", lead.designType, lead.timeline].filter(Boolean),
    internalNotes: lead.internalNotes,
    detailItems: detailItems([
      ["Company", lead.company],
      ["Design type", lead.designType],
      ["Timeline", lead.timeline],
      ["Sample requirement", lead.sampleRequirement],
      ["Sample review", lead.sampleReview],
      ["Priority", lead.priority]
    ]),
    documents: storedFiles.map((href, index) => ({ name: `Project file ${index + 1}`, href, access: "Admin only" as const })),
    serviceMode: lead.designType || "Project submission",
    owner: lead.ownerId,
    timeline: [
      { id: `${lead.id}-submitted`, label: "Project submitted", createdAt: lead.submissionDate, visibility: "Customer visible" },
      ...(lead.statusHistory || []).map((item) => ({ id: item.id, label: item.label, actor: item.actor, createdAt: item.createdAt, visibility: "Internal" as const }))
    ],
    adminHref: "/admin"
  };
}

export async function getWorkOrders(): Promise<WorkOrder[]> {
  const [ideas, customInquiries, sourceRequests, leads] = await Promise.all([
    getCommunityIdeas("recently-active", { isAdmin: true }, 200),
    getAllCustomInquiriesAdmin(),
    getSourceRequests(),
    getLeads()
  ]);

  const orders = [
    ...ideas.map(communityToWorkOrder),
    ...customInquiries.map(customInquiryToWorkOrder),
    ...sourceRequests.map(sourceToWorkOrder),
    ...leads.map(projectToWorkOrder)
  ];
  const events = await getWorkOrderContactEvents(orders.map((order) => order.id));
  return orders
    .map((order) => withContactHistory(order, events.filter((event) => event.workOrderId === order.id)))
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

function customInquiryStatusInput(status: WorkOrderStatus): CustomInquiryStatus {
  if (status === "Needs Reply") return "Need Information";
  if (status === "Reviewing" || status === "New") return "In Review";
  if (["Managed", "Quoted", "Sample", "Factory Introduced", "Production", "Shipping", "Completed"].includes(status)) return "Qualified";
  return "Closed";
}

function communityStatusInput(status: WorkOrderStatus): CommunityStatus {
  if (status === "Reviewing" || status === "Needs Reply" || status === "New") return "TYORA Reviewing";
  if (status === "Managed" || status === "Quoted" || status === "Sample" || status === "Factory Introduced") return "Project Started";
  if (status === "Production") return "Manufacturing";
  if (status === "Shipping") return "Shipping";
  if (status === "Completed" || status === "Closed") return "Completed";
  return "TYORA Reviewing";
}

function sourceStatusInput(status: WorkOrderStatus): SourceStatus {
  if (status === "Reviewing" || status === "Needs Reply") return "Checking Supplier";
  if (status === "Quoted") return "Quoted";
  if (status === "Sample") return "Sample Requested";
  if (status === "Factory Introduced") return "Factory Introduced";
  if (["Managed", "Production", "Shipping"].includes(status)) return "Managed Sourcing";
  if (["Completed", "Closed"].includes(status)) return "Completed";
  return "New";
}

function projectStatusInput(status: WorkOrderStatus): LeadStatus {
  if (status === "Reviewing" || status === "Needs Reply") return "Contacted";
  if (status === "Quoted") return "Quoting";
  if (status === "Sample") return "Sample Stage";
  if (status === "Production" || status === "Managed" || status === "Factory Introduced") return "Production";
  if (status === "Shipping") return "Shipment";
  if (status === "Completed") return "Completed";
  if (status === "Closed") return "Lost";
  return "New";
}

export async function updateWorkOrder(input: unknown): Promise<WorkOrder> {
  const data = input && typeof input === "object" && !Array.isArray(input) ? input as Record<string, unknown> : {};
  const id = typeof data.id === "string" ? data.id : "";
  const hasInternalNotes = typeof data.internalNotes === "string";
  const notes = hasInternalNotes ? (data.internalNotes as string).trim().slice(0, 3000) : undefined;
  const hasCustomerVisibleUpdate = typeof data.customerVisibleUpdate === "string";
  const customerVisibleUpdate = hasCustomerVisibleUpdate
    ? (data.customerVisibleUpdate as string).trim().slice(0, 3000)
    : undefined;
  const orders = await getWorkOrders();
  const order = orders.find((item) => item.id === id);
  if (!order) throw new Error("Work order not found.");
  if (typeof data.status === "string" && !workOrderStatuses.includes(data.status as WorkOrderStatus)) {
    throw new Error("Invalid work order status.");
  }
  const status = typeof data.status === "string" ? data.status as WorkOrderStatus : order.status;
  const hasCoreUpdate = typeof data.status === "string" || hasInternalNotes || hasCustomerVisibleUpdate;
  let updatedOrder = order;

  if (hasCoreUpdate && order.recordKind === "CustomInquiry") {
    const updated = await updateCustomInquiryAdmin(order.actionId, {
      status: customInquiryStatusInput(status),
      ...(hasCustomerVisibleUpdate ? { nextStep: customerVisibleUpdate } : {})
    });
    updatedOrder = { ...customInquiryToWorkOrder(updated), contactHistory: order.contactHistory, lastContactAt: order.lastContactAt, lastContactChannel: order.lastContactChannel, nextFollowUpAt: order.nextFollowUpAt };
  } else if (hasCoreUpdate && (order.type === "Idea" || order.type === "Custom")) {
    const publicUpdate = hasCustomerVisibleUpdate ? customerVisibleUpdate : hasInternalNotes ? notes : undefined;
    const updated = await updateCommunityIdeaAdmin(order.actionId, {
      status: communityStatusInput(status),
      ...(publicUpdate !== undefined ? { review: { additionalNotes: publicUpdate } } : {})
    });
    if (!updated) throw new Error("Idea not found.");
    updatedOrder = { ...communityToWorkOrder(updated), contactHistory: order.contactHistory, lastContactAt: order.lastContactAt, lastContactChannel: order.lastContactChannel, nextFollowUpAt: order.nextFollowUpAt };
  } else if (hasCoreUpdate && order.type === "Source") {
    updatedOrder = { ...sourceToWorkOrder(await updateSourceRequest(order.actionId, {
      status: sourceStatusInput(status),
      ...(hasInternalNotes ? { internalNotes: notes } : {})
    })), contactHistory: order.contactHistory, lastContactAt: order.lastContactAt, lastContactChannel: order.lastContactChannel, nextFollowUpAt: order.nextFollowUpAt };
  } else if (hasCoreUpdate && order.type === "Project") {
    updatedOrder = { ...projectToWorkOrder(await updateLead(order.actionId, {
      status: projectStatusInput(status),
      ...(hasInternalNotes ? { internalNotes: notes } : {})
    })), contactHistory: order.contactHistory, lastContactAt: order.lastContactAt, lastContactChannel: order.lastContactChannel, nextFollowUpAt: order.nextFollowUpAt };
  }

  if (data.contactEvent && typeof data.contactEvent === "object" && !Array.isArray(data.contactEvent)) {
    const contactEvent = await createWorkOrderContactEvent(order.id, data.contactEvent);
    return withContactHistory({ ...updatedOrder, updatedAt: contactEvent.createdAt }, [contactEvent, ...order.contactHistory]);
  }
  return updatedOrder;
}

function withContactHistory(order: WorkOrder, contactHistory: WorkOrderContactEvent[]): WorkOrder {
  const latest = contactHistory[0];
  const nextFollowUpAt = contactHistory
    .map((event) => event.nextFollowUpAt)
    .filter((value): value is string => typeof value === "string" && new Date(value).getTime() >= Date.now())
    .sort((left, right) => new Date(left).getTime() - new Date(right).getTime())[0];
  return {
    ...order,
    contactHistory,
    timeline: [
      ...contactHistory.map((event) => ({
        id: event.id,
        label: `${event.channel} contact recorded`,
        detail: event.note,
        createdAt: event.contactedAt,
        visibility: "Internal" as const
      })),
      ...(order.timeline || [])
    ].sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()),
    lastContactAt: latest?.contactedAt,
    lastContactChannel: latest?.channel,
    nextFollowUpAt,
    updatedAt: latest && new Date(latest.createdAt) > new Date(order.updatedAt) ? latest.createdAt : order.updatedAt
  };
}
