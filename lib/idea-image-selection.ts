export const MAX_IDEA_IMAGES = 9;

export const SUPPORTED_IDEA_IMAGE_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

const SUPPORTED_MIME_TYPES = new Set<string>(SUPPORTED_IDEA_IMAGE_MIME_TYPES);
const SUPPORTED_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp"]);

type CandidateFile = Pick<File, "name" | "type">;

export type IdeaImageSelectionResult =
  | { ok: true }
  | { ok: false; reason: "unsupported"; unsupported: CandidateFile[] }
  | { ok: false; reason: "capacity"; selected: number; remaining: number; excess: number };

function extensionOf(name: string) {
  const extension = name.split(".").pop();
  return extension && extension !== name ? extension.toLowerCase() : "";
}

export function isSupportedIdeaImage(file: CandidateFile) {
  const normalizedType = file.type.trim().toLowerCase();
  if (normalizedType) return SUPPORTED_MIME_TYPES.has(normalizedType);
  return SUPPORTED_EXTENSIONS.has(extensionOf(file.name));
}

export function validateIdeaImageSelection(files: CandidateFile[], occupiedCount: number): IdeaImageSelectionResult {
  const unsupported = files.filter((file) => !isSupportedIdeaImage(file));
  if (unsupported.length) return { ok: false, reason: "unsupported", unsupported };

  const remaining = Math.max(0, MAX_IDEA_IMAGES - occupiedCount);
  if (files.length > remaining) {
    return {
      ok: false,
      reason: "capacity",
      selected: files.length,
      remaining,
      excess: files.length - remaining
    };
  }

  return { ok: true };
}

export function summarizeUnsupportedFileNames(files: CandidateFile[]) {
  const names = files.slice(0, 3).map((file) => file.name || "unnamed file");
  if (files.length > names.length) names.push(`+${files.length - names.length}`);
  return names.join(", ");
}
