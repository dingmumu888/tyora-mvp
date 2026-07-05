import {
  defaultContent,
  defaultTeamMembers,
  Lead,
  MediaAsset,
  normalizeContent,
  normalizeLead,
  normalizeMedia,
  normalizeTeamMembers,
  SiteContent,
  TeamMember
} from "@/lib/storage";
import { AskIdea, AskStatus, normalizeAskIdea, normalizeDiscussionItem } from "@/lib/ask";
import { prisma } from "@/lib/server/db";

function parseJson<T>(value: unknown, fallback: T): T {
  if (typeof value !== "string" || !value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function dateToIso(value: Date | string | null | undefined) {
  if (!value) return new Date().toISOString();
  return value instanceof Date ? value.toISOString() : value;
}

function rowToAskIdea(row: {
  id: string;
  slug: string;
  productName: string;
  category: string;
  country: string;
  description: string;
  imageNamesJson: string;
  questionsJson: string;
  otherQuestion: string | null;
  email: string;
  whatsapp: string | null;
  visibility: string;
  status: string;
  expertReview: string | null;
  discussionJson: string;
  createdAt: Date;
  updatedAt: Date;
}): AskIdea {
  return normalizeAskIdea({
    id: row.id,
    slug: row.slug,
    productName: row.productName,
    category: row.category,
    country: row.country,
    description: row.description,
    imageNames: parseJson(row.imageNamesJson, []),
    questions: parseJson(row.questionsJson, []),
    otherQuestion: row.otherQuestion,
    email: row.email,
    whatsapp: row.whatsapp,
    visibility: row.visibility,
    status: row.status,
    expertReview: row.expertReview,
    discussion: parseJson(row.discussionJson, []),
    createdAt: dateToIso(row.createdAt),
    updatedAt: dateToIso(row.updatedAt)
  });
}

function askIdeaData(idea: AskIdea) {
  return {
    slug: idea.slug,
    productName: idea.productName,
    category: idea.category,
    country: idea.country,
    description: idea.description,
    imageNamesJson: JSON.stringify(idea.imageNames),
    questionsJson: JSON.stringify(idea.questions),
    otherQuestion: idea.otherQuestion || null,
    email: idea.email,
    whatsapp: idea.whatsapp || null,
    visibility: idea.visibility,
    status: idea.status,
    expertReview: idea.expertReview || null,
    discussionJson: JSON.stringify(idea.discussion),
    createdAt: new Date(idea.createdAt)
  };
}

function rowToLead(row: {
  id: string;
  customerName: string | null;
  company: string | null;
  email: string | null;
  country: string | null;
  category: string | null;
  productIdea: string;
  designType: string;
  quantity: string;
  budget: string;
  timeline: string;
  sampleRequirement: string;
  sampleReview: string | null;
  additionalRequirements: string;
  uploadedFile: string | null;
  uploadedFilesJson: string;
  submissionDate: Date;
  status: string;
  ownerId: string | null;
  priority: string | null;
  lastContactDate: string | null;
  nextFollowUpDate: string | null;
  internalNotes: string | null;
  internalNoteEntriesJson: string;
  statusHistoryJson: string;
}): Lead {
  return normalizeLead({
    id: row.id,
    customerName: row.customerName,
    company: row.company,
    email: row.email,
    country: row.country,
    category: row.category,
    productIdea: row.productIdea,
    designType: row.designType,
    quantity: row.quantity,
    budget: row.budget,
    timeline: row.timeline,
    sampleRequirement: row.sampleRequirement,
    sampleReview: row.sampleReview,
    additionalRequirements: row.additionalRequirements,
    uploadedFile: row.uploadedFile,
    uploadedFiles: parseJson(row.uploadedFilesJson, []),
    submissionDate: dateToIso(row.submissionDate),
    status: row.status,
    ownerId: row.ownerId,
    priority: row.priority,
    lastContactDate: row.lastContactDate,
    nextFollowUpDate: row.nextFollowUpDate,
    internalNotes: row.internalNotes,
    internalNoteEntries: parseJson(row.internalNoteEntriesJson, []),
    statusHistory: parseJson(row.statusHistoryJson, [])
  });
}

function leadData(lead: Lead) {
  return {
    customerName: lead.customerName || null,
    company: lead.company || null,
    email: lead.email || null,
    country: lead.country || null,
    category: lead.category || null,
    productIdea: lead.productIdea,
    designType: lead.designType,
    quantity: lead.quantity,
    budget: lead.budget,
    timeline: lead.timeline,
    sampleRequirement: lead.sampleRequirement,
    sampleReview: lead.sampleReview || null,
    additionalRequirements: lead.additionalRequirements,
    uploadedFile: lead.uploadedFile || null,
    uploadedFilesJson: JSON.stringify(lead.uploadedFiles || []),
    submissionDate: new Date(lead.submissionDate),
    status: lead.status,
    ownerId: lead.ownerId || "unassigned",
    priority: lead.priority || "Medium",
    lastContactDate: lead.lastContactDate || null,
    nextFollowUpDate: lead.nextFollowUpDate || null,
    internalNotes: lead.internalNotes || null,
    internalNoteEntriesJson: JSON.stringify(lead.internalNoteEntries || []),
    statusHistoryJson: JSON.stringify(lead.statusHistory || [])
  };
}

function mediaData(asset: MediaAsset) {
  return {
    name: asset.name,
    url: asset.url,
    type: asset.type,
    mimeType: asset.mimeType,
    size: asset.size,
    createdAt: new Date(asset.createdAt)
  };
}

export async function getContent(): Promise<SiteContent> {
  const row = await prisma.siteContent.findUnique({
    where: { id: "default" }
  });
  return row ? normalizeContent(parseJson(row.data, defaultContent)) : defaultContent;
}

export async function putContent(content: unknown): Promise<SiteContent> {
  const normalized = normalizeContent(content);
  await prisma.siteContent.upsert({
    where: { id: "default" },
    create: {
      id: "default",
      data: JSON.stringify(normalized)
    },
    update: {
      data: JSON.stringify(normalized)
    }
  });
  return normalized;
}

export async function getLeads(): Promise<Lead[]> {
  const rows = await prisma.lead.findMany({
    orderBy: { submissionDate: "desc" }
  });
  return rows.map(rowToLead);
}

export async function createLead(lead: unknown): Promise<Lead> {
  const normalized = normalizeLead(lead);
  await prisma.lead.upsert({
    where: { id: normalized.id },
    create: {
      id: normalized.id,
      ...leadData(normalized)
    },
    update: leadData(normalized)
  });
  return normalized;
}

export async function putLeads(leads: unknown): Promise<Lead[]> {
  const normalized = Array.isArray(leads) ? leads.map(normalizeLead) : [];
  await prisma.$transaction(async (tx) => {
    await tx.lead.deleteMany();
    if (normalized.length > 0) {
      await tx.lead.createMany({
        data: normalized.map((lead) => ({
          id: lead.id,
          ...leadData(lead)
        }))
      });
    }
  });
  return normalized;
}

export async function getMedia(): Promise<MediaAsset[]> {
  const rows = await prisma.mediaAsset.findMany({
    orderBy: { createdAt: "desc" }
  });
  return normalizeMedia(
    rows.map((row) => ({
      id: row.id,
      name: row.name,
      url: row.url,
      type: row.type,
      mimeType: row.mimeType,
      size: row.size,
      createdAt: dateToIso(row.createdAt)
    }))
  );
}

export async function putMedia(media: unknown): Promise<MediaAsset[]> {
  const normalized = normalizeMedia(media);
  await prisma.$transaction(async (tx) => {
    await tx.mediaAsset.deleteMany();
    if (normalized.length > 0) {
      await tx.mediaAsset.createMany({
        data: normalized.map((asset) => ({
          id: asset.id,
          ...mediaData(asset)
        }))
      });
    }
  });
  return normalized;
}

export async function createMediaAsset(asset: unknown): Promise<MediaAsset> {
  const [normalized] = normalizeMedia([asset]);
  await prisma.mediaAsset.upsert({
    where: { id: normalized.id },
    create: {
      id: normalized.id,
      ...mediaData(normalized)
    },
    update: mediaData(normalized)
  });
  return normalized;
}

export async function getTeamMembers(): Promise<TeamMember[]> {
  const rows = await prisma.teamMember.findMany({
    orderBy: { createdAt: "asc" }
  });
  if (rows.length === 0) {
    return putTeamMembers(defaultTeamMembers);
  }
  return normalizeTeamMembers(rows);
}

export async function putTeamMembers(members: unknown): Promise<TeamMember[]> {
  const normalized = normalizeTeamMembers(members);
  await prisma.$transaction(async (tx) => {
    await tx.teamMember.deleteMany();
    if (normalized.length > 0) {
      await tx.teamMember.createMany({
        data: normalized.map((member) => ({
          id: member.id,
          name: member.name,
          avatar: member.avatar,
          email: member.email,
          role: member.role,
          active: member.active
        }))
      });
    }
  });
  return normalized;
}

export async function getAskIdeas(): Promise<AskIdea[]> {
  const rows = await prisma.askIdea.findMany({
    orderBy: { createdAt: "desc" }
  });
  return rows.map(rowToAskIdea);
}

export async function getAskIdeaBySlug(slug: string): Promise<AskIdea | null> {
  const row = await prisma.askIdea.findUnique({
    where: { slug }
  });
  return row ? rowToAskIdea(row) : null;
}

export async function countAskReviewsForEmailToday(email: string): Promise<number> {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  return prisma.askIdea.count({
    where: {
      email,
      createdAt: {
        gte: start
      }
    }
  });
}

export async function createAskIdea(idea: unknown): Promise<AskIdea> {
  const normalized = normalizeAskIdea(idea);
  await prisma.askIdea.upsert({
    where: { id: normalized.id },
    create: {
      id: normalized.id,
      ...askIdeaData(normalized)
    },
    update: askIdeaData(normalized)
  });
  return normalized;
}

export async function updateAskIdea(slug: string, updates: unknown): Promise<AskIdea> {
  const existing = await getAskIdeaBySlug(slug);
  if (!existing) {
    throw new Error("Ask idea not found.");
  }

  const data = updates && typeof updates === "object" && !Array.isArray(updates) ? (updates as Record<string, unknown>) : {};
  const merged = normalizeAskIdea({
    ...existing,
    status: data.status || existing.status,
    expertReview: typeof data.expertReview === "string" ? data.expertReview : existing.expertReview,
    discussion: Array.isArray(data.discussion)
      ? data.discussion.map(normalizeDiscussionItem)
      : existing.discussion
  });

  await prisma.askIdea.update({
    where: { slug },
    data: {
      status: merged.status as AskStatus,
      expertReview: merged.expertReview || null,
      discussionJson: JSON.stringify(merged.discussion)
    }
  });
  return merged;
}
