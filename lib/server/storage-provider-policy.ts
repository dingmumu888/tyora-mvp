type StorageEnvironment = Record<string, string | undefined>;

export class StorageProviderConfigurationError extends Error {
  constructor() {
    super("Object storage is not configured.");
    this.name = "StorageProviderConfigurationError";
  }
}

export function resolveStorageProviderKind(
  environment: StorageEnvironment = process.env
): "supabase" {
  const value = environment.TYORA_STORAGE_PROVIDER?.trim().toLowerCase() || "supabase";
  if (value !== "supabase") {
    throw new StorageProviderConfigurationError();
  }
  return value;
}
