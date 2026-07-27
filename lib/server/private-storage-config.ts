type PrivateStorageEnvironment = Record<string, string | undefined>;

export class PrivateStorageConfigurationError extends Error {
  constructor() {
    super("Private storage is not configured.");
    this.name = "PrivateStorageConfigurationError";
  }
}

export function getPrivateStorageConfig(
  environment: PrivateStorageEnvironment = process.env
) {
  const rawUrl = environment.SUPABASE_URL?.trim();
  const serviceRoleKey = environment.SUPABASE_SERVICE_ROLE_KEY?.trim();
  const bucket = environment.SUPABASE_PRIVATE_STORAGE_BUCKET?.trim();
  const publicBucket = environment.SUPABASE_STORAGE_BUCKET?.trim() || "tyora-media";

  if (!rawUrl || !serviceRoleKey || !bucket || !/^[a-z0-9][a-z0-9._-]{1,62}$/i.test(bucket)) {
    throw new PrivateStorageConfigurationError();
  }
  if (bucket === publicBucket || bucket === "tyora-media") {
    throw new PrivateStorageConfigurationError();
  }

  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new PrivateStorageConfigurationError();
  }
  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    (url.pathname !== "/" && url.pathname !== "") ||
    url.search ||
    url.hash
  ) {
    throw new PrivateStorageConfigurationError();
  }

  return {
    supabaseUrl: url.origin,
    serviceRoleKey,
    bucket
  };
}
