import { createSupabaseStorageProvider } from "./supabase-storage-provider";
import { StorageEnvironment, StorageProvider } from "./storage-provider-contract";
import { resolveStorageProviderKind } from "./storage-provider-policy";

export {
  resolveStorageProviderKind,
  StorageProviderConfigurationError
} from "./storage-provider-policy";
export type {
  PublicStorageUpload,
  StorageEnvironment,
  StorageProvider,
  StorageUploadInput
} from "./storage-provider-contract";

export function getStorageProvider(
  environment: StorageEnvironment = process.env
): StorageProvider {
  switch (resolveStorageProviderKind(environment)) {
    case "supabase":
      return createSupabaseStorageProvider(environment);
  }
}
