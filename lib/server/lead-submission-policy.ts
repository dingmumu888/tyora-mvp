const fieldLimits: Record<string, number> = {
  customerName: 120,
  company: 160,
  email: 254,
  country: 120,
  category: 120,
  productIdea: 3000,
  designType: 120,
  quantity: 80,
  budget: 80,
  timeline: 120,
  sampleRequirement: 500,
  sampleReview: 500,
  additionalRequirements: 3000
};

const publicLeadFields = new Set([
  ...Object.keys(fieldLimits),
  "uploadedFile",
  "uploadedFiles"
]);

const MAX_PUBLIC_LEAD_PAYLOAD_BYTES = 64 * 1024;
const MAX_PUBLIC_LEAD_FILES = 10;

export type PublicLeadSubmission = {
  customerName: string;
  company: string;
  email: string;
  country: string;
  category: string;
  productIdea: string;
  designType: string;
  quantity: string;
  budget: string;
  timeline: string;
  sampleRequirement: string;
  sampleReview: string;
  additionalRequirements: string;
  uploadedFile: string;
  uploadedFiles: string[];
};

function textField(body: Record<string, unknown>, key: string) {
  const value = body[key];
  return typeof value === "string" ? value.trim() : "";
}

export function validatePublicLeadSubmission(
  body: unknown,
  isAllowedPrivateFileReference: (value: string) => boolean
) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return "Invalid project submission.";
  }

  const data = body as Record<string, unknown>;
  if (Object.keys(data).some((key) => !publicLeadFields.has(key))) {
    return "Invalid project submission fields.";
  }
  const email = textField(data, "email");
  const productIdea = textField(data, "productIdea");

  if (!productIdea) return "Product idea is required.";
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return "Please enter a valid email address.";
  }

  for (const [key, maxLength] of Object.entries(fieldLimits)) {
    const value = data[key];
    if (value !== undefined && typeof value !== "string") {
      return `${key} must be text.`;
    }
    if (typeof value === "string" && value.trim().length > maxLength) {
      return `${key} must be ${maxLength} characters or fewer.`;
    }
  }

  const uploadedFile = data.uploadedFile;
  if (
    uploadedFile !== undefined &&
    (typeof uploadedFile !== "string" ||
      (uploadedFile.trim() && !isAllowedPrivateFileReference(uploadedFile.trim())))
  ) {
    return "Invalid private project file reference.";
  }

  const uploadedFiles = data.uploadedFiles;
  if (
    uploadedFiles !== undefined &&
    (!Array.isArray(uploadedFiles) ||
      uploadedFiles.length > MAX_PUBLIC_LEAD_FILES ||
      uploadedFiles.some(
        (value) => typeof value !== "string" || !isAllowedPrivateFileReference(value.trim())
      ))
  ) {
    return "Invalid private project file references.";
  }

  return null;
}

export function parsePublicLeadSubmission(
  body: unknown,
  isAllowedPrivateFileReference: (value: string) => boolean
): { data?: PublicLeadSubmission; error?: string } {
  const error = validatePublicLeadSubmission(body, isAllowedPrivateFileReference);
  if (error) return { error };

  const source = body as Record<string, unknown>;
  const text = (key: string) => textField(source, key).slice(0, fieldLimits[key] || 0);
  return {
    data: {
      customerName: text("customerName"),
      company: text("company"),
      email: text("email").toLowerCase(),
      country: text("country"),
      category: text("category"),
      productIdea: text("productIdea"),
      designType: text("designType"),
      quantity: text("quantity"),
      budget: text("budget"),
      timeline: text("timeline"),
      sampleRequirement: text("sampleRequirement"),
      sampleReview: text("sampleReview"),
      additionalRequirements: text("additionalRequirements"),
      uploadedFile: textField(source, "uploadedFile"),
      uploadedFiles: Array.isArray(source.uploadedFiles)
        ? source.uploadedFiles.map((value) => String(value).trim()).filter(Boolean)
        : []
    }
  };
}

export async function readPublicLeadRequest(
  request: Request,
  isAllowedPrivateFileReference: (value: string) => boolean
): Promise<
  | { error: string; status: 400 | 413 }
  | { data: PublicLeadSubmission }
> {
  const contentType = request.headers.get("content-type")?.split(";", 1)[0]?.trim().toLowerCase();
  if (contentType !== "application/json") {
    return { error: "Project submission must be JSON.", status: 400 as const };
  }

  const declaredLength = request.headers.get("content-length")?.trim();
  if (declaredLength && /^\d+$/.test(declaredLength) && Number(declaredLength) > MAX_PUBLIC_LEAD_PAYLOAD_BYTES) {
    return { error: "Project submission is too large.", status: 413 as const };
  }

  if (!request.body) {
    return { error: "Invalid project submission.", status: 400 as const };
  }

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.byteLength;
      if (totalBytes > MAX_PUBLIC_LEAD_PAYLOAD_BYTES) {
        await reader.cancel().catch(() => undefined);
        return { error: "Project submission is too large.", status: 413 as const };
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const bodyBytes = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    bodyBytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  let rawBody: string;
  try {
    rawBody = new TextDecoder("utf-8", { fatal: true }).decode(bodyBytes);
  } catch {
    return { error: "Invalid project submission.", status: 400 as const };
  }

  let body: unknown;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return { error: "Invalid project submission.", status: 400 as const };
  }
  const parsed = parsePublicLeadSubmission(body, isAllowedPrivateFileReference);
  return parsed.error
    ? { error: parsed.error, status: 400 as const }
    : { data: parsed.data as PublicLeadSubmission };
}
