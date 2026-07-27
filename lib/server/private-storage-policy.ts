const MAX_PRIVATE_UPLOAD_BYTES = 20 * 1024 * 1024;
const MAX_DISPLAY_NAME_LENGTH = 160;

const allowedFileTypes = new Map([
  ["image/jpeg", new Set([".jpg", ".jpeg"])],
  ["image/png", new Set([".png"])],
  ["image/webp", new Set([".webp"])],
  ["application/pdf", new Set([".pdf"])]
]);

const allowedExtensions = new Set(
  [...allowedFileTypes.values()].flatMap((extensions) => [...extensions])
);

const uuidPattern =
  "[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}";
const privateObjectPathPattern = new RegExp(
  `^(?:project-submissions|idea-submissions|custom-submissions)/\\d{4}/(?:0[1-9]|1[0-2])/\\d{13}-${uuidPattern}\\.(?:jpg|jpeg|png|webp|pdf)$`,
  "i"
);
const privateLeadObjectPathPattern = new RegExp(
  `^project-submissions/\\d{4}/(?:0[1-9]|1[0-2])/\\d{13}-${uuidPattern}\\.(?:jpg|jpeg|png|webp|pdf)$`,
  "i"
);

export class PrivateUploadValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PrivateUploadValidationError";
  }
}

function extensionFromName(name: string) {
  const match = name.toLowerCase().match(/\.[a-z0-9]+$/);
  return match?.[0] || "";
}

function startsWith(bytes: Uint8Array, signature: number[]) {
  return signature.every((value, index) => bytes[index] === value);
}

function hasExpectedSignature(mimeType: string, bytes: Uint8Array) {
  if (mimeType === "image/jpeg") {
    return startsWith(bytes, [0xff, 0xd8, 0xff]);
  }
  if (mimeType === "image/png") {
    return startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  }
  if (mimeType === "image/webp") {
    return (
      startsWith(bytes, [0x52, 0x49, 0x46, 0x46]) &&
      bytes[8] === 0x57 &&
      bytes[9] === 0x45 &&
      bytes[10] === 0x42 &&
      bytes[11] === 0x50
    );
  }
  if (mimeType === "application/pdf") {
    return startsWith(bytes, [0x25, 0x50, 0x44, 0x46, 0x2d]);
  }
  return false;
}

export function validatePrivateUploadBytes(input: {
  displayName: string;
  mimeType: string;
  size: number;
  header: Uint8Array;
}) {
  const displayName = input.displayName.trim();
  if (
    !displayName ||
    displayName.length > MAX_DISPLAY_NAME_LENGTH ||
    displayName === "." ||
    displayName === ".." ||
    /[\u0000-\u001f\u007f/\\\u202a-\u202e\u2066-\u2069]/.test(displayName)
  ) {
    throw new PrivateUploadValidationError("The filename is not allowed.");
  }

  if (input.size === 0) {
    throw new PrivateUploadValidationError("The file is empty.");
  }
  if (input.size > MAX_PRIVATE_UPLOAD_BYTES) {
    throw new PrivateUploadValidationError("Maximum 20MB for project files.");
  }

  const extension = extensionFromName(displayName);
  const expectedExtensions = allowedFileTypes.get(input.mimeType);
  if (!expectedExtensions?.has(extension)) {
    throw new PrivateUploadValidationError(
      "The file type must match a JPG, PNG, WebP, or PDF filename."
    );
  }

  if (!hasExpectedSignature(input.mimeType, input.header)) {
    throw new PrivateUploadValidationError("The file signature does not match its type.");
  }

  return { extension, displayName };
}

export async function validatePrivateUploadFile(file: File) {
  return validatePrivateUploadBytes({
    displayName: file.name,
    mimeType: file.type,
    size: file.size,
    header: new Uint8Array(await file.slice(0, 16).arrayBuffer())
  });
}

export function isAllowedPrivateObjectPath(objectPath: string) {
  return privateObjectPathPattern.test(objectPath);
}

export function buildPrivateObjectPath(
  extension: string,
  options: { now?: Date; id?: string } = {}
) {
  const normalizedExtension = extension.toLowerCase();
  if (!allowedExtensions.has(normalizedExtension)) {
    throw new PrivateUploadValidationError("The private file extension is not allowed.");
  }

  const now = options.now ?? new Date();
  const id = options.id ?? crypto.randomUUID();
  if (Number.isNaN(now.getTime()) || !new RegExp(`^${uuidPattern}$`, "i").test(id)) {
    throw new PrivateUploadValidationError("Unable to create a safe private file path.");
  }

  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  return `project-submissions/${now.getUTCFullYear()}/${month}/${now.getTime()}-${id}${normalizedExtension}`;
}

export function buildPrivateIdeaObjectPath(
  extension: string,
  options: { now?: Date; id?: string } = {}
) {
  return buildPrivateObjectPath(extension, options).replace(
    /^project-submissions\//,
    "idea-submissions/"
  );
}

export function buildPrivateCustomObjectPath(
  extension: string,
  options: { now?: Date; id?: string } = {}
) {
  return buildPrivateObjectPath(extension, options).replace(
    /^project-submissions\//,
    "custom-submissions/"
  );
}

export function isAllowedPrivateCustomObjectPath(objectPath: string) {
  return objectPath.startsWith("custom-submissions/") && isAllowedPrivateObjectPath(objectPath);
}

export function isAllowedPrivateLeadObjectPath(objectPath: string) {
  return privateLeadObjectPathPattern.test(objectPath);
}

export function buildPrivateFileAccessUrl(objectPath: string) {
  if (!isAllowedPrivateLeadObjectPath(objectPath)) {
    throw new PrivateUploadValidationError("The private file path is not allowed.");
  }
  return `/api/leads/files?path=${encodeURIComponent(objectPath)}`;
}

export function isAllowedPrivateFileAccessUrl(value: string) {
  if (!value.startsWith("/api/leads/files?")) return false;

  let url: URL;
  try {
    url = new URL(value, "https://private-files.tyora.invalid");
  } catch {
    return false;
  }

  const keys = [...url.searchParams.keys()];
  const objectPaths = url.searchParams.getAll("path");
  return (
    url.origin === "https://private-files.tyora.invalid" &&
    url.pathname === "/api/leads/files" &&
    !url.hash &&
    keys.length === 1 &&
    keys[0] === "path" &&
    objectPaths.length === 1 &&
    isAllowedPrivateLeadObjectPath(objectPaths[0])
  );
}
