import { getStorageProvider } from "./storage-provider";
import { isAllowedPublicObjectPath } from "./public-storage-policy";

export class PublicStorageProviderError extends Error {
  constructor() {
    super("Public storage upload failed.");
    this.name = "PublicStorageProviderError";
  }
}

export async function uploadPublicObject(
  objectPath: string,
  bytes: ArrayBuffer,
  contentType: string
) {
  if (!isAllowedPublicObjectPath(objectPath)) {
    throw new PublicStorageProviderError();
  }

  try {
    return await getStorageProvider().uploadPublicObject({ objectPath, bytes, contentType });
  } catch {
    throw new PublicStorageProviderError();
  }
}
