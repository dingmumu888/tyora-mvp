import { createHmac, timingSafeEqual } from "node:crypto";
import { isAllowedPrivateObjectPath } from "@/lib/server/private-storage-policy";

type CommunityImageUploadTokenPayload = {
  receiptId: string;
  userId: string;
  objectPath: string;
  expiresAt: number;
};

function tokenSecret() {
  const value = process.env.COMMUNITY_SESSION_SECRET || process.env.ADMIN_SESSION_SECRET;
  if (!value) throw new Error("Community image uploads are not configured.");
  return value;
}

function signature(payload: string) {
  return createHmac("sha256", tokenSecret()).update(payload).digest("base64url");
}

function safeEqual(left: string, right: string) {
  const leftBytes = Buffer.from(left);
  const rightBytes = Buffer.from(right);
  return leftBytes.length === rightBytes.length && timingSafeEqual(leftBytes, rightBytes);
}

export function createCommunityImageUploadToken(payload: CommunityImageUploadTokenPayload) {
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${encoded}.${signature(encoded)}`;
}

export function verifyCommunityImageUploadToken(
  token: string,
  expectedUserId: string,
  now = Date.now()
): CommunityImageUploadTokenPayload {
  const [encoded, providedSignature, extra] = token.split(".");
  if (!encoded || !providedSignature || extra || !safeEqual(signature(encoded), providedSignature)) {
    throw new Error("Invalid community image upload reference.");
  }
  let payload: CommunityImageUploadTokenPayload;
  try {
    payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as CommunityImageUploadTokenPayload;
  } catch {
    throw new Error("Invalid community image upload reference.");
  }
  if (
    typeof payload.receiptId !== "string" ||
    typeof payload.userId !== "string" ||
    payload.userId !== expectedUserId ||
    typeof payload.objectPath !== "string" ||
    !payload.objectPath.startsWith("idea-submissions/") ||
    !isAllowedPrivateObjectPath(payload.objectPath) ||
    !Number.isSafeInteger(payload.expiresAt) ||
    payload.expiresAt <= now
  ) {
    throw new Error("Expired or invalid community image upload reference.");
  }
  return payload;
}

export function communityImageUploadReference(token: string) {
  return `/api/community/idea-images/${encodeURIComponent(token)}`;
}

export function communityImageUploadTokenFromReference(value: string) {
  let parsed: URL;
  try {
    parsed = new URL(value, "https://community-images.tyora.invalid");
  } catch {
    return null;
  }
  const match = parsed.pathname.match(/^\/api\/community\/idea-images\/([^/]+)$/);
  if (
    parsed.origin !== "https://community-images.tyora.invalid" ||
    parsed.search ||
    parsed.hash ||
    !match
  ) return null;
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return null;
  }
}
