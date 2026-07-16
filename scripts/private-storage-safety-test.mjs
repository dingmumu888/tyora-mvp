import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  buildPrivateFileAccessUrl,
  buildPrivateIdeaObjectPath,
  buildPrivateObjectPath,
  isAllowedPrivateFileAccessUrl,
  isAllowedPrivateObjectPath,
  validatePrivateUploadFile
} from "../lib/server/private-storage-policy.ts";
import { assertPrivateBucketMetadata } from "../lib/server/private-storage-bucket-policy.ts";
import { normalizePrivateSignedUrl } from "../lib/server/private-storage-signed-url-policy.ts";
import { validatePublicLeadSubmission } from "../lib/server/lead-submission-policy.ts";
import { getPrivateStorageConfig } from "../lib/server/private-storage-config.ts";
import {
  createPrivateUploadRateLimiter,
  PrivateUploadRequestError,
  validatePrivateUploadRequest
} from "../lib/server/private-upload-request-policy.ts";

const pngBytes = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]);

test("valid image metadata and signature are accepted", async () => {
  const file = new File([pngBytes], "design.png", { type: "image/png" });
  assert.deepEqual(await validatePrivateUploadFile(file), {
    extension: ".png",
    displayName: "design.png"
  });
});

test("MIME, extension, and signature must agree", async () => {
  const spoofed = new File([Uint8Array.from([1, 2, 3, 4])], "design.png", { type: "image/png" });
  await assert.rejects(() => validatePrivateUploadFile(spoofed), /signature/i);

  const mismatched = new File([pngBytes], "design.pdf", { type: "image/png" });
  await assert.rejects(() => validatePrivateUploadFile(mismatched), /type/i);
});

test("empty, oversized, and path-like filenames are rejected", async () => {
  await assert.rejects(
    () => validatePrivateUploadFile(new File([], "empty.pdf", { type: "application/pdf" })),
    /empty/i
  );
  await assert.rejects(
    () =>
      validatePrivateUploadFile(
        new File([new Uint8Array(20 * 1024 * 1024 + 1)], "large.pdf", { type: "application/pdf" })
      ),
    /20MB/i
  );
  await assert.rejects(
    () => validatePrivateUploadFile(new File([pngBytes], "../design.png", { type: "image/png" })),
    /filename/i
  );
});

test("generated object paths are constrained to the private submission namespace", () => {
  const objectPath = buildPrivateObjectPath(".pdf", {
    now: new Date("2026-07-13T12:34:56.000Z"),
    id: "123e4567-e89b-42d3-a456-426614174000"
  });
  assert.equal(
    objectPath,
    "project-submissions/2026/07/1783946096000-123e4567-e89b-42d3-a456-426614174000.pdf"
  );
  assert.equal(isAllowedPrivateObjectPath(objectPath), true);
  assert.equal(isAllowedPrivateObjectPath("project-submissions/../../secret.pdf"), false);
  assert.equal(isAllowedPrivateObjectPath("cms/2026/07/secret.pdf"), false);
  assert.equal(
    isAllowedPrivateObjectPath(buildPrivateIdeaObjectPath(".png", {
      now: new Date("2026-07-13T12:34:56.000Z"),
      id: "123e4567-e89b-42d3-a456-426614174000"
    })),
    true
  );
});

test("private file references use an authenticated application route, not a public Storage URL", () => {
  const objectPath = "project-submissions/2026/07/1783946096000-123e4567-e89b-42d3-a456-426614174000.pdf";
  const accessUrl = buildPrivateFileAccessUrl(objectPath);
  assert.match(accessUrl, /^\/api\/leads\/files\?path=/);
  assert.equal(isAllowedPrivateFileAccessUrl(accessUrl), true);
  assert.equal(isAllowedPrivateFileAccessUrl(`https://example.com${accessUrl}`), false);
  assert.equal(isAllowedPrivateFileAccessUrl("javascript:alert(1)"), false);
  assert.equal(isAllowedPrivateFileAccessUrl("/api/leads/files?path=cms%2Fasset.pdf"), false);
  assert.doesNotMatch(accessUrl, /storage\/v1\/object\/public/);
});

test("private bucket metadata must prove that the exact bucket is non-public", () => {
  assert.doesNotThrow(() =>
    assertPrivateBucketMetadata("tyora-private-submissions", {
      id: "tyora-private-submissions",
      name: "tyora-private-submissions",
      public: false
    })
  );
  assert.throws(
    () =>
      assertPrivateBucketMetadata("tyora-private-submissions", {
        id: "tyora-private-submissions",
        public: true
      }),
    /not private/i
  );
  assert.throws(
    () =>
      assertPrivateBucketMetadata("tyora-private-submissions", {
        id: "another-bucket",
        name: "tyora-private-submissions",
        public: false
      }),
    /not private/i
  );
  assert.throws(
    () =>
      assertPrivateBucketMetadata("tyora-private-submissions", {
        id: "tyora-private-submissions",
        name: "another-bucket",
        public: false
      }),
    /not private/i
  );
});

test("private Storage configuration never falls back to the public bucket", () => {
  assert.throws(
    () =>
      getPrivateStorageConfig({
        SUPABASE_URL: "https://preview-ref.supabase.co",
        SUPABASE_SERVICE_ROLE_KEY: "present",
        SUPABASE_STORAGE_BUCKET: "tyora-media"
      }),
    /private storage/i
  );

  assert.equal(
    getPrivateStorageConfig({
      SUPABASE_URL: "https://preview-ref.supabase.co",
      SUPABASE_SERVICE_ROLE_KEY: "present",
      SUPABASE_PRIVATE_STORAGE_BUCKET: "tyora-private-submissions"
    }).bucket,
    "tyora-private-submissions"
  );
});

test("private Custom access route is admin-only and signs short-lived URLs", async () => {
  const route = await readFile(new URL("../app/api/leads/files/route.ts", import.meta.url), "utf8");
  const storage = await readFile(new URL("../lib/server/private-storage.ts", import.meta.url), "utf8");
  const signedUrlPolicy = await readFile(
    new URL("../lib/server/private-storage-signed-url-policy.ts", import.meta.url),
    "utf8"
  );
  assert.match(route, /hasAdminSession/);
  assert.match(route, /status:\s*404/);
  assert.match(route, /createPrivateSignedUrl/);
  assert.match(route, /["']Cache-Control["']:\s*["']private, no-store/);
  assert.match(route, /fetch\(signedUrl/);
  assert.match(route, /cache:\s*["']no-store["']/);
  assert.doesNotMatch(route, /NextResponse\.redirect/);
  assert.doesNotMatch(route, /storage\/v1\/object\/public/);
  assert.equal(storage.match(/await assertPrivateBucketIsPrivate\(config\)/g)?.length, 2);
  assert.match(storage, /Math\.min\(120,/);
  assert.match(signedUrlPolicy, /signedUrl\.pathname !== signedPath/);
  assert.match(storage, /Cache-Control["']?:\s*["']private, no-store, max-age=0/);
});

test("provider-relative Supabase signed URLs normalize under the Storage API base", () => {
  const origin = "https://preview-ref.supabase.co";
  const objectPath =
    "project-submissions/2026/07/1783946096000-123e4567-e89b-42d3-a456-426614174000.pdf";
  const signedPath = `/storage/v1/object/sign/tyora-private-submissions/${objectPath}`;
  const result = normalizePrivateSignedUrl(
    `/object/sign/tyora-private-submissions/${objectPath}?token=synthetic-test-token`,
    origin,
    signedPath
  );
  const normalized = new URL(result);
  assert.equal(normalized.origin, origin);
  assert.equal(normalized.pathname, signedPath);
  assert.equal(normalized.searchParams.get("token"), "synthetic-test-token");

  assert.throws(
    () =>
      normalizePrivateSignedUrl(
        `/object/sign/another-bucket/${objectPath}?token=synthetic-test-token`,
        origin,
        signedPath
      ),
    /sign failed/i
  );
});

test("private upload request policy rejects oversized, cross-origin, and unbounded bodies", () => {
  const validRequest = new Request("https://www.tyora.io/api/leads/upload", {
    method: "POST",
    headers: {
      "content-length": "1024",
      origin: "https://www.tyora.io",
      "sec-fetch-site": "same-origin"
    }
  });
  assert.doesNotThrow(() => validatePrivateUploadRequest(validRequest));

  for (const headers of [
    { origin: "https://www.tyora.io" },
    { "content-length": String(22 * 1024 * 1024), origin: "https://www.tyora.io" },
    { "content-length": "1024", origin: "https://attacker.invalid" }
  ]) {
    const request = new Request("https://www.tyora.io/api/leads/upload", {
      method: "POST",
      headers
    });
    assert.throws(
      () => validatePrivateUploadRequest(request),
      (error) => error instanceof PrivateUploadRequestError
    );
  }
});

test("private upload request rate limiting is fail-closed per transient client key", () => {
  const enforceRateLimit = createPrivateUploadRateLimiter({ limit: 2, windowMs: 1_000 });
  const request = new Request("https://www.tyora.io/api/leads/upload", {
    headers: { "x-forwarded-for": "203.0.113.10" }
  });
  assert.doesNotThrow(() => enforceRateLimit(request, 1_000));
  assert.doesNotThrow(() => enforceRateLimit(request, 1_001));
  assert.throws(
    () => enforceRateLimit(request, 1_002),
    (error) => error instanceof PrivateUploadRequestError && error.status === 429
  );
  assert.doesNotThrow(() => enforceRateLimit(request, 2_001));
});

test("upload route applies request guards before parsing multipart data", async () => {
  const route = await readFile(new URL("../app/api/leads/upload/route.ts", import.meta.url), "utf8");
  const validationIndex = route.indexOf("validatePrivateUploadRequest(request)");
  const rateLimitIndex = route.indexOf("enforcePrivateUploadRateLimit(request)");
  const formDataIndex = route.indexOf("request.formData()");
  assert.ok(validationIndex >= 0 && validationIndex < formDataIndex);
  assert.ok(rateLimitIndex >= 0 && rateLimitIndex < formDataIndex);
});

test("public lead creation accepts only protected private-file references", async () => {
  const route = await readFile(new URL("../app/api/leads/route.ts", import.meta.url), "utf8");
  const policy = await readFile(
    new URL("../lib/server/lead-submission-policy.ts", import.meta.url),
    "utf8"
  );
  assert.match(route, /isAllowedPrivateFileAccessUrl/);
  assert.match(route, /readPublicLeadRequest/);
  assert.match(policy, /uploadedFiles/);
});

test("lead submission payload validation rejects bypassed file references", () => {
  const objectPath = "project-submissions/2026/07/1783946096000-123e4567-e89b-42d3-a456-426614174000.pdf";
  const privateReference = buildPrivateFileAccessUrl(objectPath);
  assert.equal(
    validatePublicLeadSubmission(
      {
        productIdea: "Private product idea",
        uploadedFile: privateReference,
        uploadedFiles: [privateReference]
      },
      isAllowedPrivateFileAccessUrl
    ),
    null
  );
  assert.match(
    validatePublicLeadSubmission(
      {
        productIdea: "Private product idea",
        uploadedFile: "https://example.com/customer-design.pdf"
      },
      isAllowedPrivateFileAccessUrl
    ) || "",
    /private project file/i
  );
  assert.match(
    validatePublicLeadSubmission(
      {
        productIdea: "Private product idea",
        uploadedFiles: ["javascript:alert(1)"]
      },
      isAllowedPrivateFileAccessUrl
    ) || "",
    /private project file/i
  );
});

test("public CMS upload route accepts only public image and video media", async () => {
  const route = await readFile(new URL("../app/api/media/upload/route.ts", import.meta.url), "utf8");
  for (const confidentialType of ["application/pdf", "application/octet-stream", "model/stl", "model/step"]) {
    assert.doesNotMatch(route, new RegExp(confidentialType));
  }
});
