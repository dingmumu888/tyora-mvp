import { deletePublicObject, uploadPublicObject } from "@/lib/server/public-storage";

const allowedMimeTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);
const maxImageBytes = 8 * 1024 * 1024;

function extensionFor(file: File) {
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  if (file.type === "image/avif") return "avif";
  return "jpg";
}

export function validateWeeklySourceImage(file: File) {
  if (!allowedMimeTypes.has(file.type)) return "Upload a JPG, PNG, WebP, or AVIF image.";
  if (file.size <= 0 || file.size > maxImageBytes) return "Product images must be 8MB or smaller.";
  return null;
}

export async function uploadWeeklySourceImage(file: File) {
  const validationError = validateWeeklySourceImage(file);
  if (validationError) throw new Error(validationError);

  const now = new Date();
  const objectPath = [
    "image",
    now.getUTCFullYear(),
    String(now.getUTCMonth() + 1).padStart(2, "0"),
    `weekly-source-${Date.now()}-${crypto.randomUUID()}.${extensionFor(file)}`
  ].join("/");
  const uploaded = await uploadPublicObject(objectPath, await file.arrayBuffer(), file.type);
  return { imageUrl: uploaded.publicUrl, imageObjectPath: objectPath };
}

export async function deleteWeeklySourceImage(objectPath: string) {
  if (!/^image\/\d{4}\/(0[1-9]|1[0-2])\/weekly-source-[a-zA-Z0-9._-]+$/.test(objectPath)) {
    throw new Error("Invalid weekly Source image path.");
  }
  await deletePublicObject(objectPath);
}
