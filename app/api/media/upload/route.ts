import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { fail, messageFromError, ok } from "@/lib/server/api-response";
import { createMediaAsset } from "@/lib/server/data-store";

const allowedMimeTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/svg+xml",
  "video/mp4",
  "video/webm",
  "application/pdf"
]);

function mediaTypeFromMime(mimeType: string) {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  return "pdf";
}

function safeFilename(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "-").replace(/-+/g, "-");
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return fail("Missing file.", 400);
    }

    if (!allowedMimeTypes.has(file.type)) {
      return fail("Unsupported file type.", 400);
    }

    const type = mediaTypeFromMime(file.type);
    const maxSize = type === "image" ? 10 : type === "video" ? 200 : 20;
    if (file.size > maxSize * 1024 * 1024) {
      return fail(`Maximum ${maxSize}MB for ${type} files.`, 400);
    }

    const uploadsDirectory = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadsDirectory, { recursive: true });

    const filename = `${Date.now()}-${safeFilename(file.name)}`;
    const diskPath = path.join(uploadsDirectory, filename);
    const bytes = Buffer.from(await file.arrayBuffer());
    await writeFile(diskPath, bytes);

    const asset = await createMediaAsset({
      id: `media-${crypto.randomUUID()}`,
      name: filename,
      url: `/uploads/${filename}`,
      type,
      mimeType: file.type,
      size: file.size,
      createdAt: new Date().toISOString()
    });

    return ok(asset);
  } catch (error) {
    return fail(messageFromError(error, "Unable to upload media."));
  }
}
