import { getPrivateStorageConfig } from "./private-storage-config";
import { assertPrivateBucketMetadata } from "./private-storage-bucket-policy";
import { isAllowedPrivateObjectPath } from "./private-storage-policy";
import { normalizePrivateSignedUrl } from "./private-storage-signed-url-policy";

export class PrivateStorageProviderError extends Error {
  constructor(operation: "verify" | "upload" | "sign") {
    super(`Private storage ${operation} failed.`);
    this.name = "PrivateStorageProviderError";
  }
}

async function assertPrivateBucketIsPrivate(config: ReturnType<typeof getPrivateStorageConfig>) {
  const response = await fetch(
    `${config.supabaseUrl}/storage/v1/bucket/${encodeURIComponent(config.bucket)}`,
    {
      method: "GET",
      headers: {
        apikey: config.serviceRoleKey,
        Authorization: `Bearer ${config.serviceRoleKey}`
      }
    }
  );
  if (!response.ok) {
    throw new PrivateStorageProviderError("verify");
  }
  const payload = await response.json().catch(() => null);
  try {
    assertPrivateBucketMetadata(config.bucket, payload);
  } catch {
    throw new PrivateStorageProviderError("verify");
  }
}

function encodedObjectPath(objectPath: string) {
  return objectPath.split("/").map(encodeURIComponent).join("/");
}

export async function uploadPrivateObject(
  objectPath: string,
  bytes: ArrayBuffer,
  contentType: string
) {
  if (!isAllowedPrivateObjectPath(objectPath)) {
    throw new PrivateStorageProviderError("upload");
  }

  const config = getPrivateStorageConfig();
  await assertPrivateBucketIsPrivate(config);
  const endpoint = `${config.supabaseUrl}/storage/v1/object/${encodeURIComponent(config.bucket)}/${encodedObjectPath(objectPath)}`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      apikey: config.serviceRoleKey,
      Authorization: `Bearer ${config.serviceRoleKey}`,
      "Content-Type": contentType,
      "Cache-Control": "private, no-store, max-age=0",
      "x-upsert": "false"
    },
    body: bytes
  });

  if (!response.ok) {
    throw new PrivateStorageProviderError("upload");
  }
}

export async function createPrivateSignedUrl(objectPath: string, expiresInSeconds = 120) {
  if (!isAllowedPrivateObjectPath(objectPath)) {
    throw new PrivateStorageProviderError("sign");
  }

  const config = getPrivateStorageConfig();
  await assertPrivateBucketIsPrivate(config);
  const expiresIn = Math.max(30, Math.min(120, Math.floor(expiresInSeconds)));
  const signedPath = `/storage/v1/object/sign/${encodeURIComponent(config.bucket)}/${encodedObjectPath(objectPath)}`;
  const response = await fetch(`${config.supabaseUrl}${signedPath}`, {
    method: "POST",
    headers: {
      apikey: config.serviceRoleKey,
      Authorization: `Bearer ${config.serviceRoleKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ expiresIn })
  });

  if (!response.ok) {
    throw new PrivateStorageProviderError("sign");
  }

  const body = (await response.json().catch(() => null)) as
    | { signedURL?: unknown; signedUrl?: unknown }
    | null;
  const value = body?.signedURL ?? body?.signedUrl;
  if (typeof value !== "string") {
    throw new PrivateStorageProviderError("sign");
  }

  try {
    return normalizePrivateSignedUrl(value, config.supabaseUrl, signedPath);
  } catch {
    throw new PrivateStorageProviderError("sign");
  }
}
