import { fail, ok } from "@/lib/server/api-response";
import sharp, { type Metadata } from "sharp";
import { getCommunitySession, refreshCommunitySessionCookieIfNeeded } from "@/lib/server/community-auth";
import {
  communityImageUploadReference,
  createCommunityImageUploadToken
} from "@/lib/server/community-image-upload-token";
import { prisma } from "@/lib/server/db";
import {
  buildPrivateIdeaObjectPath,
  PrivateUploadValidationError,
  validatePrivateUploadBytes,
  validatePrivateUploadFile
} from "@/lib/server/private-storage-policy";
import {
  deletePrivateObject,
  PrivateStorageProviderError,
  uploadPrivateObject
} from "@/lib/server/private-storage";
import {
  createPrivateUploadRateLimiter,
  PrivateUploadRequestError,
  validatePrivateUploadRequest
} from "@/lib/server/private-upload-request-policy";
import { makeCommunityId } from "@/lib/community";

export const runtime = "nodejs";
const MAX_IDEA_IMAGE_BYTES = 1_500_000;
const UPLOAD_TTL_MS = 24 * 60 * 60 * 1000;
const enforceIdeaImageUploadRateLimit = createPrivateUploadRateLimiter({ limit: 18 });

async function normalizeIdeaImage(file: File) {
  const source = Buffer.from(await file.arrayBuffer());
  let metadata: Metadata;
  try {
    metadata = await sharp(source, { failOn: "error", limitInputPixels: 50_000_000 }).metadata();
  } catch {
    throw new PrivateUploadValidationError("The uploaded image could not be safely decoded.");
  }
  const preserveTransparency = metadata.format === "png" && metadata.hasAlpha === true;
  const attempts = [
    { dimension: 2048, quality: 82 },
    { dimension: 1760, quality: 78 },
    { dimension: 1440, quality: 74 },
    { dimension: 1200, quality: 70 }
  ];
  for (const attempt of attempts) {
    const pipeline = sharp(source, { failOn: "error", limitInputPixels: 50_000_000 })
      .rotate()
      .resize({
        width: attempt.dimension,
        height: attempt.dimension,
        fit: "inside",
        withoutEnlargement: true
      });
    const bytes = preserveTransparency
      ? await pipeline.png({ compressionLevel: 9, effort: 7 }).toBuffer()
      : await pipeline.webp({ quality: attempt.quality, effort: 4 }).toBuffer();
    if (bytes.byteLength <= MAX_IDEA_IMAGE_BYTES) {
      const contentType = preserveTransparency ? "image/png" : "image/webp";
      const extension = preserveTransparency ? ".png" : ".webp";
      validatePrivateUploadBytes({
        displayName: `idea${extension}`,
        mimeType: contentType,
        size: bytes.byteLength,
        header: new Uint8Array(bytes.buffer, bytes.byteOffset, Math.min(16, bytes.byteLength))
      });
      return { bytes, contentType, extension };
    }
  }
  throw new PrivateUploadValidationError("This image could not be reduced below 1.5MB without losing too much detail.");
}

export async function POST(request: Request) {
  const session = await getCommunitySession();
  if (!session) return fail("Email login is required to upload idea images.", 401);

  let objectPath = "";
  try {
    validatePrivateUploadRequest(request);
    enforceIdeaImageUploadRateLimit(request);
    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) return fail("Missing image.", 400);
    if (!new Set(["image/jpeg", "image/png", "image/webp"]).has(file.type)) {
      return fail("Idea images must be JPG, PNG, or WebP.", 400);
    }
    if (file.size > MAX_IDEA_IMAGE_BYTES) {
      return fail("Each prepared idea image must be 1.5MB or smaller.", 413);
    }
    const validated = await validatePrivateUploadFile(file);
    const normalized = await normalizeIdeaImage(file);
    objectPath = buildPrivateIdeaObjectPath(normalized.extension);
    const normalizedArrayBuffer = normalized.bytes.buffer.slice(
      normalized.bytes.byteOffset,
      normalized.bytes.byteOffset + normalized.bytes.byteLength
    ) as ArrayBuffer;
    await uploadPrivateObject(objectPath, normalizedArrayBuffer, normalized.contentType);

    const receiptId = makeCommunityId("UPLOAD");
    const expiresAt = new Date(Date.now() + UPLOAD_TTL_MS);
    await prisma.communityActionReceipt.create({
      data: {
        id: receiptId,
        userId: session.userId,
        action: "idea-image-upload",
        resourceId: objectPath,
        resultJson: JSON.stringify({ contentType: normalized.contentType, size: normalized.bytes.byteLength }),
        expiresAt
      }
    });
    const token = createCommunityImageUploadToken({
      receiptId,
      userId: session.userId,
      objectPath,
      expiresAt: expiresAt.getTime()
    });
    return refreshCommunitySessionCookieIfNeeded(ok({
      reference: communityImageUploadReference(token),
      name: validated.displayName,
      size: normalized.bytes.byteLength
    }), session);
  } catch (error) {
    if (objectPath) await deletePrivateObject(objectPath).catch(() => undefined);
    if (error instanceof PrivateUploadRequestError) return fail(error.message, error.status);
    if (error instanceof PrivateUploadValidationError) return fail(error.message, 400);
    if (error instanceof PrivateStorageProviderError) return fail("Private image storage is temporarily unavailable.", 503);
    return fail("Unable to upload idea image.", 503);
  }
}
