const PUBLIC_COMMUNITY_IMAGE_PATH = /^\/api\/community\/ideas\/[^/]+\/images\/[0-8]$/;

export function communityThumbnailUrl(src?: string) {
  if (!src?.startsWith("/")) return src;

  let parsed: URL;
  try {
    parsed = new URL(src, "https://images.tyora.invalid");
  } catch {
    return src;
  }

  if (parsed.origin !== "https://images.tyora.invalid" || !PUBLIC_COMMUNITY_IMAGE_PATH.test(parsed.pathname)) {
    return src;
  }

  parsed.searchParams.set("variant", "thumbnail");
  return `${parsed.pathname}${parsed.search}`;
}
