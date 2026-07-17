import type { CustomInquiry as CustomInquiryRow, TyoraReview } from "@prisma/client";
import { CustomInquiry } from "@/lib/community";
import { prisma } from "@/lib/server/db";
import {
  assertCanReadCustomInquiry,
  CustomInquiryAccessContext,
  normalizeCustomInquiryStatus,
  parseCustomInquirySubmission
} from "@/lib/server/custom-inquiry-policy";
import { isApprovedPublicIdea } from "@/lib/server/idea-access-policy";
import {
  buildPrivateCustomObjectPath,
  isAllowedPrivateCustomObjectPath,
  validatePrivateUploadFile
} from "@/lib/server/private-storage-policy";
import { uploadPrivateObject } from "@/lib/server/private-storage";

type StoredCustomFile = {
  name: string;
  objectPath: string;
  mimeType: string;
  size: number;
};

function parseJson<T>(value: unknown, fallback: T): T {
  if (typeof value !== "string" || !value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function iso(value: Date | string) {
  return value instanceof Date ? value.toISOString() : value;
}

function customInquiryPublic(row: CustomInquiryRow): CustomInquiry {
  const files = parseJson<StoredCustomFile[]>(row.privateFilesJson, []);
  return {
    id: row.id,
    ideaId: row.ideaId || undefined,
    productName: row.productName,
    productDescription: row.productDescription,
    category: row.category,
    quantity: row.quantity,
    budget: row.budget,
    targetMarket: row.targetMarket,
    timeline: row.timeline,
    contactEmail: row.contactEmail || undefined,
    contactWhatsapp: row.contactWhatsapp || undefined,
    fileCount: files.length,
    status: row.status,
    nextStep: row.nextStep || undefined,
    ideaSnapshot: parseJson(row.ideaSnapshotJson, undefined),
    assessmentSnapshot: parseJson(row.assessmentSnapshotJson, undefined),
    createdAt: iso(row.createdAt),
    updatedAt: iso(row.updatedAt)
  };
}

function publishedAssessmentSnapshot(review: TyoraReview | null | undefined) {
  if (!review || review.assessmentStatus !== "Published") return {};
  return {
    manufacturingFeasible: review.manufacturingFeasible || undefined,
    estimatedCostRange: review.estimatedCostRange || undefined,
    estimatedMoq: review.estimatedMoq || undefined,
    assumptions: review.assumptions || undefined,
    confidence: review.confidence || undefined,
    assessmentStatus: "Published",
    disclaimer: review.disclaimer,
    suggestedMaterial: review.suggestedMaterial || undefined,
    suggestedManufacturing: review.suggestedManufacturing || undefined,
    moldRequirement: review.moldRequirement || undefined,
    mainRisks: review.mainRisks || undefined,
    recommendedNextStep: review.recommendedNextStep || undefined,
    customEligible: Boolean(review.customEligible),
    publishedAt: review.publishedAt ? iso(review.publishedAt) : undefined
  };
}

export async function getEligibleCustomIdeaContext(slug: string, userId: string) {
  const idea = await prisma.communityIdea.findUnique({ where: { slug }, include: { review: true } });
  if (!idea || idea.authorId !== userId || !idea.review?.customEligible || idea.review.assessmentStatus !== "Published") {
    return null;
  }
  return {
    id: idea.id,
    slug: idea.slug,
    title: idea.title,
    description: idea.description,
    category: idea.category,
    assessment: publishedAssessmentSnapshot(idea.review)
  };
}

export async function createCustomInquiry(input: unknown, userId: string, sessionEmail: string) {
  const data = parseCustomInquirySubmission(input);
  const idea = data.ideaSlug
    ? await prisma.communityIdea.findUnique({ where: { slug: data.ideaSlug }, include: { review: true } })
    : null;
  if (data.ideaSlug) {
    if (!idea || idea.authorId !== userId) throw new Error("The linked Idea is not available.");
    if (!idea.review?.customEligible || idea.review.assessmentStatus !== "Published") {
      throw new Error("This Idea is not yet eligible for a Custom project.");
    }
  }

  const productName = data.productName || idea?.title || "";
  const productDescription = data.productDescription || idea?.description || "";
  const category = data.category || idea?.category || "";
  if (!productName || !productDescription || !category || !data.quantity || !data.targetMarket) {
    throw new Error("Product name, description, category, quantity, and target market are required.");
  }

  const ideaSnapshot = idea
    ? isApprovedPublicIdea(idea)
      ? { id: idea.id, slug: idea.slug, title: idea.title, category: idea.category }
      : { id: idea.id }
    : {};
  const assessmentSnapshot = idea ? publishedAssessmentSnapshot(idea.review) : {};
  const row = await prisma.customInquiry.create({
    data: {
      id: `CUSTOM-${crypto.randomUUID()}`,
      userId,
      ideaId: idea?.id || null,
      productName,
      productDescription,
      category,
      quantity: data.quantity,
      budget: data.budget,
      targetMarket: data.targetMarket,
      timeline: data.timeline,
      contactEmail: data.contactEmail || sessionEmail,
      contactWhatsapp: data.contactWhatsapp || null,
      ideaSnapshotJson: JSON.stringify(ideaSnapshot),
      assessmentSnapshotJson: JSON.stringify(assessmentSnapshot)
    }
  });
  return customInquiryPublic(row);
}

export async function getCustomInquiriesForUser(userId: string) {
  const rows = await prisma.customInquiry.findMany({ where: { userId }, orderBy: { createdAt: "desc" } });
  return rows.map(customInquiryPublic);
}

export async function getCustomInquiry(id: string, context: CustomInquiryAccessContext) {
  const row = await prisma.customInquiry.findUnique({ where: { id } });
  assertCanReadCustomInquiry(row, context);
  return customInquiryPublic(row);
}

export async function getAllCustomInquiriesAdmin() {
  const rows = await prisma.customInquiry.findMany({ orderBy: { createdAt: "desc" } });
  return rows.map(customInquiryPublic);
}

export async function updateCustomInquiryAdmin(id: string, input: unknown) {
  const existing = await prisma.customInquiry.findUnique({ where: { id } });
  if (!existing) throw new Error("Custom inquiry not found.");
  const data = input && typeof input === "object" && !Array.isArray(input) ? input as Record<string, unknown> : {};
  const allowed = new Set(["status", "nextStep"]);
  if (Object.keys(data).some((key) => !allowed.has(key))) throw new Error("Invalid Custom inquiry fields.");
  const status = normalizeCustomInquiryStatus(data.status ?? existing.status);
  const nextStep = typeof data.nextStep === "string" ? data.nextStep.trim().slice(0, 3000) || null : existing.nextStep;
  return customInquiryPublic(await prisma.customInquiry.update({ where: { id }, data: { status, nextStep } }));
}

export async function addCustomInquiryFile(id: string, file: File, userId: string) {
  const inquiry = await prisma.customInquiry.findUnique({ where: { id } });
  assertCanReadCustomInquiry(inquiry, { userId });
  const files = parseJson<StoredCustomFile[]>(inquiry.privateFilesJson, []);
  if (files.length >= 5) throw new Error("A maximum of 5 private files is allowed.");
  const validated = await validatePrivateUploadFile(file);
  const objectPath = buildPrivateCustomObjectPath(validated.extension);
  await uploadPrivateObject(objectPath, await file.arrayBuffer(), file.type);
  const nextFile: StoredCustomFile = {
    name: validated.displayName,
    objectPath,
    mimeType: file.type,
    size: file.size
  };
  await prisma.customInquiry.update({
    where: { id },
    data: { privateFilesJson: JSON.stringify([...files, nextFile]) }
  });
  return { index: files.length, name: validated.displayName };
}

export async function getCustomInquiryFile(
  id: string,
  index: number,
  context: CustomInquiryAccessContext
) {
  if (!Number.isInteger(index) || index < 0 || index > 4) return null;
  const inquiry = await prisma.customInquiry.findUnique({ where: { id } });
  assertCanReadCustomInquiry(inquiry, context);
  const file = parseJson<StoredCustomFile[]>(inquiry.privateFilesJson, [])[index];
  if (!file || !isAllowedPrivateCustomObjectPath(file.objectPath)) return null;
  return file;
}
