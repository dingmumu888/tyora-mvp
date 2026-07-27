import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  resolveStorageProviderKind,
  StorageProviderConfigurationError
} from "../lib/server/storage-provider-policy.ts";
import { isAllowedPublicObjectPath } from "../lib/server/public-storage-policy.ts";

test("Supabase remains the compatible default storage provider", () => {
  assert.equal(resolveStorageProviderKind({}), "supabase");
  assert.equal(resolveStorageProviderKind({ TYORA_STORAGE_PROVIDER: " SUPABASE " }), "supabase");
});

test("unknown storage providers fail closed", () => {
  assert.throws(
    () => resolveStorageProviderKind({ TYORA_STORAGE_PROVIDER: "filesystem" }),
    (error) => error instanceof StorageProviderConfigurationError
  );
});

test("public object paths remain constrained to CMS media namespaces", () => {
  assert.equal(isAllowedPublicObjectPath("image/2026/07/123-product.webp"), true);
  assert.equal(isAllowedPublicObjectPath("video/2026/12/123-demo.mp4"), true);
  assert.equal(isAllowedPublicObjectPath("private/2026/07/customer.pdf"), false);
  assert.equal(isAllowedPublicObjectPath("image/2026/07/../customer.pdf"), false);
  assert.equal(isAllowedPublicObjectPath("image/2026/13/product.webp"), false);
});

test("application storage facades contain no Supabase transport details", async () => {
  const mediaRoute = await readFile(new URL("../app/api/media/upload/route.ts", import.meta.url), "utf8");
  const publicStorage = await readFile(new URL("../lib/server/public-storage.ts", import.meta.url), "utf8");
  const privateStorage = await readFile(new URL("../lib/server/private-storage.ts", import.meta.url), "utf8");
  const leadUpload = await readFile(new URL("../app/api/leads/upload/route.ts", import.meta.url), "utf8");
  const customUpload = await readFile(
    new URL("../app/api/community/custom/[id]/files/route.ts", import.meta.url),
    "utf8"
  );
  const adapter = await readFile(new URL("../lib/server/supabase-storage-provider.ts", import.meta.url), "utf8");

  for (const source of [mediaRoute, publicStorage, privateStorage, leadUpload, customUpload]) {
    assert.doesNotMatch(source, /SUPABASE_|storage\/v1|supabase\.co/i);
    assert.doesNotMatch(source, /PrivateStorageConfigurationError|private-storage-config/);
  }
  assert.match(mediaRoute, /uploadPublicObject/);
  assert.match(publicStorage, /getStorageProvider\(\)\.uploadPublicObject/);
  assert.match(privateStorage, /getStorageProvider\(\)\.uploadPrivateObject/);
  assert.match(privateStorage, /getStorageProvider\(\)\.createPrivateSignedUrl/);
  assert.match(adapter, /SUPABASE_URL/);
  assert.match(adapter, /SUPABASE_SERVICE_ROLE_KEY/);
  assert.match(adapter, /storage\/v1/);
});
