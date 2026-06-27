import { fail, messageFromError, ok } from "@/lib/server/api-response";
import { createMediaAsset } from "@/lib/server/data-store";

export const runtime = "nodejs";

const allowedMimeTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/svg+xml",
  "video/mp4",
  "video/webm",
  "application/pdf",
  "application/octet-stream",
  "application/acad",
  "application/dxf",
  "model/stl",
  "model/step"
]);

const allowedExtensions = new Set([
  ".pdf",
  ".step",
  ".stp",
  ".iges",
  ".igs",
  ".obj",
  ".stl",
  ".dwg",
  ".dxf"
]);

function extensionFromName(name: string) {
  const match = name.toLowerCase().match(/\.[a-z0-9]+$/);
  return match?.[0] || "";
}

function isAllowedFile(file: File) {
  return allowedMimeTypes.has(file.type) || allowedExtensions.has(extensionFromName(file.name));
}

function mediaTypeFromFile(file: File) {
  if (file.type.startsWith("image/")) return "image";
  if (file.type.startsWith("video/")) return "video";
  return "pdf";
}

function safeFilename(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "-").replace(/-+/g, "-");
}

function requiredEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not configured.`);
  }
  return value;
}

async function uploadToSupabaseStorage(file: File, type: string) {
  const supabaseUrl = requiredEnv("SUPABASE_URL").replace(/\/$/, "");
  const serviceRoleKey = requiredEnv("SUPABASE_SERVICE_ROLE_KEY");
  const bucket = process.env.SUPABASE_STORAGE_BUCKET || "tyora-media";
  const now = new Date();
  const filename = `${Date.now()}-${safeFilename(file.name)}`;
  const objectPath = `${type}/${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, "0")}/${filename}`;
  const bytes = Buffer.from(await file.arrayBuffer());

  const response = await fetch(`${supabaseUrl}/storage/v1/object/${bucket}/${objectPath}`, {
    method: "POST",
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": file.type || "application/octet-stream",
      "x-upsert": "false"
    },
    body: bytes
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Supabase Storage upload failed (${response.status}).`);
  }

  return {
    filename,
    publicUrl: `${supabaseUrl}/storage/v1/object/public/${bucket}/${objectPath}`
  };
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return fail("Missing file.", 400);
    }

    if (!isAllowedFile(file)) {
      return fail("Unsupported file type.", 400);
    }

    const type = mediaTypeFromFile(file);
    const maxSize = type === "image" ? 10 : type === "video" ? 200 : 20;
    if (file.size > maxSize * 1024 * 1024) {
      return fail(`Maximum ${maxSize}MB for ${type} files.`, 400);
    }

    const uploaded = await uploadToSupabaseStorage(file, type);

    const asset = await createMediaAsset({
      id: `media-${crypto.randomUUID()}`,
      name: uploaded.filename,
      url: uploaded.publicUrl,
      type,
      mimeType: file.type || "application/octet-stream",
      size: file.size,
      createdAt: new Date().toISOString()
    });

    return ok(asset);
  } catch (error) {
    return fail(messageFromError(error, "Unable to upload media."));
  }
}
