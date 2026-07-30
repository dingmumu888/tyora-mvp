import { createHash } from "node:crypto";
import {
  AdminSourceWeeklyProduct,
  PublicSourceWeeklyProduct,
  sourceWeeklyStatuses,
  SourceWeeklyStatus
} from "@/lib/source-weekly";
import { prisma } from "@/lib/server/db";
import { deleteWeeklySourceImage } from "@/lib/server/source-weekly-image";
import { weeklySourceWhatsAppUrl } from "@/lib/whatsapp";

const DAY_MS = 24 * 60 * 60 * 1000;
const LIVE_DAYS = 7;
const PURGE_DAYS = 30;

type WeeklyProductRow = {
  id: string;
  productCode: string;
  title: string;
  titleZh: string | null;
  summary: string | null;
  summaryZh: string | null;
  factoryPrice: string | null;
  moq: string | null;
  imageUrl: string;
  imageObjectPath: string;
  status: string;
  publishedAt: Date | null;
  expiresAt: Date | null;
  purgeAt: Date | null;
  interestCount: number;
  createdAt: Date;
  updatedAt: Date;
};

function text(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function iso(value: Date | null) {
  return value ? value.toISOString() : undefined;
}

function normalizeStatus(value: unknown): SourceWeeklyStatus {
  return sourceWeeklyStatuses.includes(value as SourceWeeklyStatus)
    ? value as SourceWeeklyStatus
    : "DRAFT";
}

function productCode() {
  const day = new Date().toISOString().slice(2, 10).replace(/-/g, "");
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `WP-${day}-${suffix}`;
}

function publicProduct(row: WeeklyProductRow): PublicSourceWeeklyProduct {
  return {
    id: row.id,
    productCode: row.productCode,
    title: row.title,
    titleZh: row.titleZh || undefined,
    summary: row.summary || undefined,
    summaryZh: row.summaryZh || undefined,
    factoryPrice: row.factoryPrice || undefined,
    moq: row.moq || undefined,
    imageUrl: row.imageUrl,
    interestCount: row.interestCount,
    publishedAt: iso(row.publishedAt),
    expiresAt: iso(row.expiresAt)
  };
}

function adminProduct(row: WeeklyProductRow): AdminSourceWeeklyProduct {
  return {
    ...publicProduct(row),
    imageObjectPath: row.imageObjectPath,
    status: normalizeStatus(row.status),
    purgeAt: iso(row.purgeAt),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString()
  };
}

function publicationDates(now = new Date()) {
  return {
    publishedAt: now,
    expiresAt: new Date(now.getTime() + LIVE_DAYS * DAY_MS),
    purgeAt: new Date(now.getTime() + PURGE_DAYS * DAY_MS)
  };
}

function validateProductInput(input: Record<string, unknown>, requireImage: boolean) {
  if (!text(input.title, 140)) return "Product title is required.";
  if (requireImage && (!text(input.imageUrl, 2048) || !text(input.imageObjectPath, 512))) {
    return "Product image is required.";
  }
  return null;
}

export async function getPublicWeeklySourceProducts(now = new Date()) {
  const rows = await prisma.sourceWeeklyProduct.findMany({
    where: {
      status: "LIVE",
      publishedAt: { lte: now },
      expiresAt: { gt: now }
    },
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    take: 8
  });
  return rows.map(publicProduct);
}

export async function getAdminWeeklySourceProducts() {
  const rows = await prisma.sourceWeeklyProduct.findMany({
    orderBy: [{ createdAt: "desc" }]
  });
  return rows.map(adminProduct);
}

export async function createWeeklySourceProduct(
  input: Record<string, unknown> & { imageUrl: string; imageObjectPath: string }
) {
  const validationError = validateProductInput(input, true);
  if (validationError) throw new Error(validationError);
  const publishNow = input.publishNow === true || input.publishNow === "true";
  const dates = publishNow ? publicationDates() : null;

  const row = await prisma.sourceWeeklyProduct.create({
    data: {
      id: `weekly-${crypto.randomUUID()}`,
      productCode: text(input.productCode, 40) || productCode(),
      title: text(input.title, 140),
      titleZh: text(input.titleZh, 140) || null,
      summary: text(input.summary, 320) || null,
      summaryZh: text(input.summaryZh, 320) || null,
      factoryPrice: text(input.factoryPrice, 80) || null,
      moq: text(input.moq, 80) || null,
      imageUrl: input.imageUrl,
      imageObjectPath: input.imageObjectPath,
      status: publishNow ? "LIVE" : "DRAFT",
      ...dates
    }
  });
  return adminProduct(row);
}

export async function updateWeeklySourceProduct(id: string, input: unknown) {
  const data = input && typeof input === "object" && !Array.isArray(input)
    ? input as Record<string, unknown>
    : {};
  const existing = await prisma.sourceWeeklyProduct.findUnique({ where: { id } });
  if (!existing) throw new Error("Weekly product not found.");

  const action = text(data.action, 40);
  if (action === "publish") {
    const dates = publicationDates();
    return adminProduct(await prisma.sourceWeeklyProduct.update({
      where: { id },
      data: { status: "LIVE", ...dates }
    }));
  }
  if (action === "unpublish") {
    return adminProduct(await prisma.sourceWeeklyProduct.update({
      where: { id },
      data: { status: "UNPUBLISHED" }
    }));
  }
  if (action === "extend") {
    const now = new Date();
    const base = existing.expiresAt && existing.expiresAt > now ? existing.expiresAt : now;
    const expiresAt = new Date(base.getTime() + LIVE_DAYS * DAY_MS);
    const purgeAt = new Date(expiresAt.getTime() + (PURGE_DAYS - LIVE_DAYS) * DAY_MS);
    return adminProduct(await prisma.sourceWeeklyProduct.update({
      where: { id },
      data: {
        status: "LIVE",
        publishedAt: existing.publishedAt || now,
        expiresAt,
        purgeAt
      }
    }));
  }

  const title = Object.prototype.hasOwnProperty.call(data, "title")
    ? text(data.title, 140)
    : existing.title;
  if (!title) throw new Error("Product title is required.");

  const row = await prisma.sourceWeeklyProduct.update({
    where: { id },
    data: {
      title,
      ...(Object.prototype.hasOwnProperty.call(data, "titleZh") ? { titleZh: text(data.titleZh, 140) || null } : {}),
      ...(Object.prototype.hasOwnProperty.call(data, "summary") ? { summary: text(data.summary, 320) || null } : {}),
      ...(Object.prototype.hasOwnProperty.call(data, "summaryZh") ? { summaryZh: text(data.summaryZh, 320) || null } : {}),
      ...(Object.prototype.hasOwnProperty.call(data, "factoryPrice") ? { factoryPrice: text(data.factoryPrice, 80) || null } : {}),
      ...(Object.prototype.hasOwnProperty.call(data, "moq") ? { moq: text(data.moq, 80) || null } : {})
    }
  });
  return adminProduct(row);
}

async function archiveAndDelete(row: WeeklyProductRow, purgedAt = new Date()) {
  await prisma.$transaction([
    prisma.sourceWeeklyArchive.upsert({
      where: { productCode: row.productCode },
      update: {
        publishedAt: row.publishedAt,
        expiredAt: row.expiresAt,
        interestCount: row.interestCount,
        purgedAt
      },
      create: {
        id: `weekly-archive-${crypto.randomUUID()}`,
        productCode: row.productCode,
        publishedAt: row.publishedAt,
        expiredAt: row.expiresAt,
        interestCount: row.interestCount,
        purgedAt
      }
    }),
    prisma.sourceWeeklyProduct.delete({ where: { id: row.id } })
  ]);
}

export async function deleteWeeklySourceProduct(id: string) {
  const row = await prisma.sourceWeeklyProduct.findUnique({ where: { id } });
  if (!row) throw new Error("Weekly product not found.");
  await deleteWeeklySourceImage(row.imageObjectPath);
  await archiveAndDelete(row);
  return { id };
}

export async function cleanupWeeklySourceProducts(now = new Date()) {
  const expired = await prisma.sourceWeeklyProduct.findMany({
    where: { purgeAt: { lte: now } },
    orderBy: { purgeAt: "asc" },
    take: 50
  });
  const deleted: string[] = [];
  const failed: string[] = [];

  for (const row of expired) {
    try {
      await deleteWeeklySourceImage(row.imageObjectPath);
      await archiveAndDelete(row, now);
      deleted.push(row.id);
    } catch {
      failed.push(row.id);
    }
  }

  return { checked: expired.length, deleted: deleted.length, failed: failed.length };
}

export async function recordWeeklySourceInterest(
  id: string,
  visitorId: string,
  language = "en",
  now = new Date()
) {
  const product = await prisma.sourceWeeklyProduct.findFirst({
    where: {
      id,
      status: "LIVE",
      publishedAt: { lte: now },
      expiresAt: { gt: now }
    }
  });
  if (!product) throw new Error("This weekly product is no longer available.");

  const salt = process.env.SOURCE_INTEREST_HASH_SALT
    || process.env.ANALYTICS_HASH_SALT
    || process.env.CRON_SECRET
    || "tyora-source-interest";
  const visitorHash = createHash("sha256").update(`${salt}:${visitorId}`).digest("hex");
  const dayBucket = now.toISOString().slice(0, 10);
  let interestCount = product.interestCount;

  try {
    const result = await prisma.$transaction(async (tx) => {
      await tx.sourceWeeklyInterest.create({
        data: {
          id: `weekly-interest-${crypto.randomUUID()}`,
          productId: product.id,
          visitorHash,
          dayBucket
        }
      });
      return tx.sourceWeeklyProduct.update({
        where: { id: product.id },
        data: { interestCount: { increment: 1 } },
        select: { interestCount: true }
      });
    });
    interestCount = result.interestCount;
  } catch (error) {
    if ((error as { code?: string })?.code !== "P2002") throw error;
  }

  return {
    interestCount,
    whatsappUrl: weeklySourceWhatsAppUrl(product.productCode, product.title, language)
  };
}
