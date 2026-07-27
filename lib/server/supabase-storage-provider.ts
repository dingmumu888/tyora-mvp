import { assertPrivateBucketMetadata } from "./private-storage-bucket-policy";
import { getPrivateStorageConfig } from "./private-storage-config";
import { normalizePrivateSignedUrl } from "./private-storage-signed-url-policy";
import {
  StorageEnvironment,
  StorageProvider,
  StorageUploadInput
} from "./storage-provider-contract";
import { StorageProviderConfigurationError } from "./storage-provider-policy";

class SupabaseStorageProviderError extends Error {
  constructor(operation: "verify" | "upload" | "sign") {
    super(`Object storage ${operation} failed.`);
    this.name = "SupabaseStorageProviderError";
  }
}

function storageOrigin(environment: StorageEnvironment) {
  const rawUrl = environment.SUPABASE_URL?.trim();
  const serviceRoleKey = environment.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!rawUrl || !serviceRoleKey) {
    throw new StorageProviderConfigurationError();
  }

  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new StorageProviderConfigurationError();
  }
  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    (url.pathname !== "/" && url.pathname !== "") ||
    url.search ||
    url.hash
  ) {
    throw new StorageProviderConfigurationError();
  }

  return { supabaseUrl: url.origin, serviceRoleKey };
}

function publicStorageConfig(environment: StorageEnvironment) {
  const config = storageOrigin(environment);
  const bucket = environment.SUPABASE_STORAGE_BUCKET?.trim() || "tyora-media";
  if (!/^[a-z0-9][a-z0-9._-]{1,62}$/i.test(bucket)) {
    throw new StorageProviderConfigurationError();
  }
  return { ...config, bucket };
}

function headers(serviceRoleKey: string) {
  return {
    apikey: serviceRoleKey,
    Authorization: `Bearer ${serviceRoleKey}`
  };
}

function encodedObjectPath(objectPath: string) {
  return objectPath.split("/").map(encodeURIComponent).join("/");
}

async function assertPrivateBucketIsPrivate(
  config: ReturnType<typeof getPrivateStorageConfig>
) {
  const response = await fetch(
    `${config.supabaseUrl}/storage/v1/bucket/${encodeURIComponent(config.bucket)}`,
    {
      method: "GET",
      headers: headers(config.serviceRoleKey)
    }
  );
  if (!response.ok) {
    throw new SupabaseStorageProviderError("verify");
  }

  const payload = await response.json().catch(() => null);
  try {
    assertPrivateBucketMetadata(config.bucket, payload);
  } catch {
    throw new SupabaseStorageProviderError("verify");
  }
}

export function createSupabaseStorageProvider(
  environment: StorageEnvironment = process.env
): StorageProvider {
  return {
    kind: "supabase",

    async uploadPublicObject(input: StorageUploadInput) {
      const config = publicStorageConfig(environment);
      const encodedPath = encodedObjectPath(input.objectPath);
      const endpoint = `${config.supabaseUrl}/storage/v1/object/${encodeURIComponent(config.bucket)}/${encodedPath}`;
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          ...headers(config.serviceRoleKey),
          "Content-Type": input.contentType,
          "x-upsert": "false"
        },
        body: input.bytes
      });
      if (!response.ok) {
        throw new SupabaseStorageProviderError("upload");
      }

      return {
        publicUrl: `${config.supabaseUrl}/storage/v1/object/public/${encodeURIComponent(config.bucket)}/${encodedPath}`
      };
    },

    async uploadPrivateObject(input: StorageUploadInput) {
      const config = getPrivateStorageConfig(environment);
      await assertPrivateBucketIsPrivate(config);
      const endpoint = `${config.supabaseUrl}/storage/v1/object/${encodeURIComponent(config.bucket)}/${encodedObjectPath(input.objectPath)}`;
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          ...headers(config.serviceRoleKey),
          "Content-Type": input.contentType,
          "Cache-Control": "private, no-store, max-age=0",
          "x-upsert": "false"
        },
        body: input.bytes
      });
      if (!response.ok) {
        throw new SupabaseStorageProviderError("upload");
      }
    },

    async createPrivateSignedUrl(objectPath: string, expiresInSeconds: number) {
      const config = getPrivateStorageConfig(environment);
      await assertPrivateBucketIsPrivate(config);
      const signedPath = `/storage/v1/object/sign/${encodeURIComponent(config.bucket)}/${encodedObjectPath(objectPath)}`;
      const response = await fetch(`${config.supabaseUrl}${signedPath}`, {
        method: "POST",
        headers: {
          ...headers(config.serviceRoleKey),
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ expiresIn: expiresInSeconds })
      });
      if (!response.ok) {
        throw new SupabaseStorageProviderError("sign");
      }

      const body = (await response.json().catch(() => null)) as
        | { signedURL?: unknown; signedUrl?: unknown }
        | null;
      const value = body?.signedURL ?? body?.signedUrl;
      if (typeof value !== "string") {
        throw new SupabaseStorageProviderError("sign");
      }

      try {
        return normalizePrivateSignedUrl(value, config.supabaseUrl, signedPath);
      } catch {
        throw new SupabaseStorageProviderError("sign");
      }
    }
  };
}
