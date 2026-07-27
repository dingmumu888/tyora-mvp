import { isAllowedPrivateObjectPath } from "./private-storage-policy";
import { getStorageProvider } from "./storage-provider";

export class PrivateStorageProviderError extends Error {
  constructor(operation: "verify" | "upload" | "sign") {
    super(`Private storage ${operation} failed.`);
    this.name = "PrivateStorageProviderError";
  }
}

export async function uploadPrivateObject(
  objectPath: string,
  bytes: ArrayBuffer,
  contentType: string
) {
  if (!isAllowedPrivateObjectPath(objectPath)) {
    throw new PrivateStorageProviderError("upload");
  }

  try {
    await getStorageProvider().uploadPrivateObject({ objectPath, bytes, contentType });
  } catch {
    throw new PrivateStorageProviderError("upload");
  }
}

export async function createPrivateSignedUrl(objectPath: string, expiresInSeconds = 120) {
  if (!isAllowedPrivateObjectPath(objectPath)) {
    throw new PrivateStorageProviderError("sign");
  }

  const expiresIn = Math.max(30, Math.min(120, Math.floor(expiresInSeconds)));
  try {
    return await getStorageProvider().createPrivateSignedUrl(objectPath, expiresIn);
  } catch {
    throw new PrivateStorageProviderError("sign");
  }
}
