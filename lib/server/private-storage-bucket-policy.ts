export class PrivateBucketPolicyError extends Error {
  constructor() {
    super("The configured customer-file bucket is not private.");
    this.name = "PrivateBucketPolicyError";
  }
}

export function assertPrivateBucketMetadata(bucket: string, payload: unknown) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new PrivateBucketPolicyError();
  }

  const metadata = payload as { id?: unknown; name?: unknown; public?: unknown };
  const exactBucket = metadata.id === bucket && metadata.name === bucket;
  if (!exactBucket || metadata.public !== false) {
    throw new PrivateBucketPolicyError();
  }
}
