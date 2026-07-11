import { normalizeSourceNeedTypes, normalizeSourceStatus, SourceRequest } from "@/lib/source";
import { sanitizeOptionalProductLink } from "@/lib/source-contact";
import { prisma } from "@/lib/server/db";

const MAX_INLINE_SOURCE_IMAGE_LENGTH = 900000;
const MAX_SOURCE_IMAGES = 9;

function parseJson<T>(value: unknown, fallback: T): T {
  if (typeof value !== "string" || !value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function iso(value: Date | string | null | undefined) {
  if (!value) return new Date().toISOString();
  return value instanceof Date ? value.toISOString() : value;
}

function text(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function validEmailOrEmpty(value: unknown) {
  const email = text(value, 254);
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : "";
}

function safeImageUrl(value: unknown) {
  const url = text(value, MAX_INLINE_SOURCE_IMAGE_LENGTH);
  if (!url) return null;
  if (url.startsWith("data:image/")) {
    return url.length <= MAX_INLINE_SOURCE_IMAGE_LENGTH && url.includes(";base64,") ? url : null;
  }
  if (url.startsWith("https://") || url.startsWith("http://") || url.startsWith("/")) return url.slice(0, 2048);
  return null;
}

function sourceImageUrls(input: Record<string, unknown>) {
  const rawImages = Array.isArray(input.imageUrls) ? input.imageUrls : [input.imageUrl];
  return rawImages
    .map((item) => safeImageUrl(item))
    .filter((item): item is string => Boolean(item))
    .slice(0, MAX_SOURCE_IMAGES);
}

function storedSourceImages(value: unknown) {
  if (typeof value !== "string" || !value.trim()) return [];
  const parsed = parseJson<unknown>(value, null);
  const rawImages = Array.isArray(parsed) ? parsed : [value];
  return rawImages
    .map((item) => safeImageUrl(item))
    .filter((item): item is string => Boolean(item))
    .slice(0, MAX_SOURCE_IMAGES);
}

function serializeSourceImages(images: string[]) {
  if (images.length <= 1) return images[0] || null;
  return JSON.stringify(images.slice(0, MAX_SOURCE_IMAGES));
}

function sourceId() {
  return `SRC-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

function sourceToPublic(row: {
  id: string;
  productName: string;
  description: string;
  productLink: string | null;
  material: string | null;
  quantity: string;
  targetPrice: string | null;
  destinationCountry: string;
  email: string | null;
  whatsapp: string | null;
  needTypesJson: string;
  imageUrl: string | null;
  status: string;
  internalNotes: string | null;
  createdAt: Date;
  updatedAt: Date;
}): SourceRequest {
  const imageUrls = storedSourceImages(row.imageUrl);
  return {
    id: row.id,
    productName: row.productName,
    description: row.description,
    productLink: row.productLink || undefined,
    material: row.material || undefined,
    quantity: row.quantity,
    targetPrice: row.targetPrice || undefined,
    destinationCountry: row.destinationCountry,
    email: row.email || undefined,
    whatsapp: row.whatsapp || undefined,
    needTypes: normalizeSourceNeedTypes(parseJson(row.needTypesJson, [])),
    imageUrl: imageUrls[0] || undefined,
    imageUrls,
    status: normalizeSourceStatus(row.status),
    internalNotes: row.internalNotes || undefined,
    createdAt: iso(row.createdAt),
    updatedAt: iso(row.updatedAt)
  };
}

export function validateSourceRequestInput(input: unknown) {
  if (!input || typeof input !== "object" || Array.isArray(input)) return "Invalid source request.";
  const data = input as Record<string, unknown>;
  const productName = text(data.productName, 140);
  const description = text(data.description, 2000);
  const quantity = text(data.quantity, 80);
  const destinationCountry = text(data.destinationCountry, 120);
  const email = validEmailOrEmpty(data.email);
  const whatsapp = text(data.whatsapp, 80);
  const needTypes = normalizeSourceNeedTypes(data.needTypes);

  if (!productName && !description) return "Product name or description is required.";
  if (!quantity) return "Quantity needed is required.";
  if (!destinationCountry) return "Destination country is required.";
  if (!email && !whatsapp) return "Email or WhatsApp is required.";
  if (needTypes.length === 0) return "Select at least one sourcing need.";
  if (sourceImageUrls(data).length === 0) return "Upload a valid product image.";

  return null;
}

export async function createSourceRequest(input: unknown) {
  const validationError = validateSourceRequestInput(input);
  if (validationError) throw new Error(validationError);
  const data = input as Record<string, unknown>;
  const imageUrls = sourceImageUrls(data);
  const productLink = sanitizeOptionalProductLink(data.productLink);

  const row = await prisma.sourceRequest.create({
    data: {
      id: sourceId(),
      productName: text(data.productName, 140) || text(data.description, 80) || "Product reference",
      description: text(data.description, 2000),
      productLink: productLink || null,
      material: text(data.material, 160) || null,
      quantity: text(data.quantity, 80),
      targetPrice: text(data.targetPrice, 80) || null,
      destinationCountry: text(data.destinationCountry, 120),
      email: validEmailOrEmpty(data.email) || null,
      whatsapp: text(data.whatsapp, 80) || null,
      needTypesJson: JSON.stringify(normalizeSourceNeedTypes(data.needTypes)),
      imageUrl: serializeSourceImages(imageUrls),
      status: "New"
    }
  });

  return sourceToPublic(row);
}

export async function getSourceRequests() {
  const rows = await prisma.sourceRequest.findMany({ orderBy: { createdAt: "desc" } });
  return rows.map(sourceToPublic);
}

export async function getSourceRequestStats() {
  const total = await prisma.sourceRequest.count();
  return { total };
}

export async function updateSourceRequest(id: string, input: unknown) {
  const data = input && typeof input === "object" && !Array.isArray(input) ? (input as Record<string, unknown>) : {};
  const row = await prisma.sourceRequest.update({
    where: { id },
    data: {
      status: normalizeSourceStatus(data.status),
      ...(typeof data.internalNotes === "string" ? { internalNotes: text(data.internalNotes, 3000) || null } : {})
    }
  });
  return sourceToPublic(row);
}

export async function deleteSourceRequest(id: string) {
  await prisma.sourceRequest.delete({ where: { id } });
  return { id };
}
