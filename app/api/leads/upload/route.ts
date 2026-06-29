import { fail, messageFromError, ok } from "@/lib/server/api-response";

export const runtime = "nodejs";

const allowedMimeTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf"
]);

const allowedExtensionsByMime = new Map([
  ["image/jpeg", new Set([".jpg", ".jpeg"])],
  ["image/png", new Set([".png"])],
  ["image/webp", new Set([".webp"])],
  ["application/pdf", new Set([".pdf"])]
]);

const blockedExtensions = new Set([
  ".bat",
  ".cmd",
  ".com",
  ".cpl",
  ".exe",
  ".hta",
  ".html",
  ".js",
  ".jar",
  ".msi",
  ".php",
  ".ps1",
  ".scr",
  ".sh",
  ".svg",
  ".vbs"
]);

function extensionFromName(name: string) {
  const match = name.toLowerCase().match(/\.[a-z0-9]+$/);
  return match?.[0] || "";
}

function isAllowedFile(file: File) {
  const extension = extensionFromName(file.name);
  const allowedExtensions = allowedExtensionsByMime.get(file.type);
  return Boolean(
    extension &&
      allowedMimeTypes.has(file.type) &&
      allowedExtensions?.has(extension) &&
      !blockedExtensions.has(extension)
  );
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

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return fail("Missing file.", 400);
    }

    if (!isAllowedFile(file)) {
      return fail("Unsupported file type. Please upload a JPG, PNG, WebP, or PDF file.", 400);
    }

    if (file.size > 20 * 1024 * 1024) {
      return fail("Maximum 20MB for project files.", 400);
    }

    const supabaseUrl = requiredEnv("SUPABASE_URL").replace(/\/$/, "");
    const serviceRoleKey = requiredEnv("SUPABASE_SERVICE_ROLE_KEY");
    const bucket = process.env.SUPABASE_STORAGE_BUCKET || "tyora-media";
    const now = new Date();
    const filename = `${Date.now()}-${safeFilename(file.name)}`;
    const objectPath = `project-submissions/${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, "0")}/${filename}`;
    const bytes = Buffer.from(await file.arrayBuffer());

    const response = await fetch(`${supabaseUrl}/storage/v1/object/${bucket}/${objectPath}`, {
      method: "POST",
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        "Content-Type": file.type,
        "x-upsert": "false"
      },
      body: bytes
    });

    if (!response.ok) {
      const message = await response.text();
      throw new Error(message || `Supabase Storage upload failed (${response.status}).`);
    }

    return ok({
      name: filename,
      url: `${supabaseUrl}/storage/v1/object/public/${bucket}/${objectPath}`
    });
  } catch (error) {
    return fail(messageFromError(error, "Unable to upload project file."));
  }
}
