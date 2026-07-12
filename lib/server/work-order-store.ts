import { CommunityIdea, CommunityStatus } from "@/lib/community";
import { Lead, LeadStatus } from "@/lib/storage";
import { SourceRequest, SourceStatus } from "@/lib/source";
import { WorkOrder, WorkOrderContactEvent, WorkOrderStatus, workOrderStatuses } from "@/lib/work-orders";
import { getCommunityIdeas, updateCommunityIdeaAdmin } from "@/lib/server/community-store";
import { getLeads, updateLead } from "@/lib/server/data-store";
import { getSourceRequests, updateSourceRequest } from "@/lib/server/source-store";
import { createWorkOrderContactEvent, getWorkOrderContactEvents } from "@/lib/server/work-order-contact-store";

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
    internalNotes: idea.review?.additionalNotes,
    publicHref: idea.visibility === "Public" ? `/ask/${idea.slug}` : undefined,
    adminHref: "/admin/community"
  };
}

function sourceToWorkOrder(request: SourceRequest): WorkOrder {
  return {
    id: `source-${request.id}`,
    sourceId: request.id,
    actionId: request.id,
    type: "Source",
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
    publicHref: request.productLink,
    adminHref: "/admin/source"
  };
}

function projectToWorkOrder(lead: Lead): WorkOrder {
  return {
    id: `project-${lead.id}`,
    sourceId: lead.id,
    actionId: lead.id,
    type: "Project",
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
    imageUrls: lead.uploadedFiles && lead.uploadedFiles.length > 0 ? lead.uploadedFiles : lead.uploadedFile ? [lead.uploadedFile] : [],
    tags: [lead.status, lead.priority || "Medium", lead.designType, lead.timeline].filter(Boolean),
    internalNotes: lead.internalNotes,
    adminHref: "/admin"
  };
}

export async function getWorkOrders(): Promise<WorkOrder[]> {
  const [ideas, sourceRequests, leads] = await Promise.all([
    getCommunityIdeas("recently-active", true, 200),
    getSourceRequests(),
    getLeads()
  ]);

  const orders = [
    ...ideas.map(communityToWorkOrder),
    ...sourceRequests.map(sourceToWorkOrder),
    ...leads.map(projectToWorkOrder)
  ];
  const events = await getWorkOrderContactEvents(orders.map((order) => order.id));
  return orders
    .map((order) => withContactHistory(order, events.filter((event) => event.workOrderId === order.id)))
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
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
  const orders = await getWorkOrders();
  const order = orders.find((item) => item.id === id);
  if (!order) throw new Error("Work order not found.");
  if (typeof data.status === "string" && !workOrderStatuses.includes(data.status as WorkOrderStatus)) {
    throw new Error("Invalid work order status.");
  }
  const status = typeof data.status === "string" ? data.status as WorkOrderStatus : order.status;
  const hasCoreUpdate = typeof data.status === "string" || hasInternalNotes;
  let updatedOrder = order;

  if (hasCoreUpdate && (order.type === "Idea" || order.type === "Custom")) {
    const updated = await updateCommunityIdeaAdmin(order.actionId, {
      status: communityStatusInput(status),
      ...(hasInternalNotes ? { review: { additionalNotes: notes } } : {})
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
    lastContactAt: latest?.contactedAt,
    lastContactChannel: latest?.channel,
    nextFollowUpAt,
    updatedAt: latest && new Date(latest.createdAt) > new Date(order.updatedAt) ? latest.createdAt : order.updatedAt
  };
}
