import { CommunityIdea, CommunityStatus } from "@/lib/community";
import { Lead, LeadStatus } from "@/lib/storage";
import { SourceRequest, SourceStatus } from "@/lib/source";
import { WorkOrder, WorkOrderStatus } from "@/lib/work-orders";
import { getCommunityIdeas } from "@/lib/server/community-store";
import { getLeads } from "@/lib/server/data-store";
import { getSourceRequests } from "@/lib/server/source-store";

function communityStatus(status: CommunityStatus, needsReply: boolean, hidden: boolean): WorkOrderStatus {
  if (hidden) return "Closed";
  if (needsReply) return "Needs Reply";
  if (status === "TYORA Reviewing") return "Reviewing";
  if (status === "Project Started") return "Managed";
  if (status === "Manufacturing") return "Production";
  if (status === "Shipping") return "Shipping";
  if (status === "Completed") return "Completed";
  return "New";
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

  return [
    ...ideas.map(communityToWorkOrder),
    ...sourceRequests.map(sourceToWorkOrder),
    ...leads.map(projectToWorkOrder)
  ].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}
