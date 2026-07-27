import { createHash } from "node:crypto";

const MAX_PRIVATE_UPLOAD_REQUEST_BYTES = 21 * 1024 * 1024;
const DEFAULT_RATE_LIMIT = 5;
const DEFAULT_RATE_WINDOW_MS = 10 * 60 * 1000;
const MAX_TRACKED_CLIENTS = 10_000;

export class PrivateUploadRequestError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "PrivateUploadRequestError";
    this.status = status;
  }
}

export function validatePrivateUploadRequest(request: Request) {
  const rawContentLength = request.headers.get("content-length")?.trim() || "";
  if (!/^\d+$/.test(rawContentLength)) {
    throw new PrivateUploadRequestError("A bounded upload size is required.", 411);
  }
  const contentLength = Number(rawContentLength);
  if (
    !Number.isSafeInteger(contentLength) ||
    contentLength <= 0 ||
    contentLength > MAX_PRIVATE_UPLOAD_REQUEST_BYTES
  ) {
    throw new PrivateUploadRequestError("The upload request is too large.", 413);
  }

  const expectedOrigin = new URL(request.url).origin;
  const suppliedOrigin = request.headers.get("origin")?.trim() || "";
  if (suppliedOrigin !== expectedOrigin) {
    throw new PrivateUploadRequestError("Cross-origin project uploads are not allowed.", 403);
  }
  const fetchSite = request.headers.get("sec-fetch-site")?.trim().toLowerCase();
  if (fetchSite && fetchSite !== "same-origin") {
    throw new PrivateUploadRequestError("Cross-origin project uploads are not allowed.", 403);
  }
}

function transientClientKey(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const address = (forwarded || request.headers.get("x-real-ip")?.trim() || "unknown").slice(0, 256);
  return createHash("sha256").update(address).digest("hex");
}

export function createPrivateUploadRateLimiter(
  options: { limit?: number; windowMs?: number } = {}
) {
  const limit = options.limit ?? DEFAULT_RATE_LIMIT;
  const windowMs = options.windowMs ?? DEFAULT_RATE_WINDOW_MS;
  if (!Number.isInteger(limit) || limit < 1 || !Number.isInteger(windowMs) || windowMs < 1) {
    throw new Error("Invalid private upload rate-limit configuration.");
  }

  const clients = new Map<string, { count: number; expiresAt: number }>();
  return (request: Request, now = Date.now()) => {
    for (const [key, state] of clients) {
      if (state.expiresAt <= now) clients.delete(key);
    }

    const key = transientClientKey(request);
    const existing = clients.get(key);
    if (existing && existing.expiresAt > now) {
      if (existing.count >= limit) {
        throw new PrivateUploadRequestError("Too many project-file uploads. Try again later.", 429);
      }
      existing.count += 1;
      return;
    }
    if (clients.size >= MAX_TRACKED_CLIENTS) {
      throw new PrivateUploadRequestError("Project-file uploads are temporarily busy.", 429);
    }
    clients.set(key, { count: 1, expiresAt: now + windowMs });
  };
}
