import sharp from "sharp";

export const COMMUNITY_THUMBNAIL_MAX_DIMENSION = 480;
export const COMMUNITY_THUMBNAIL_QUALITY = 70;
export const MAX_COMMUNITY_IMAGE_SOURCE_BYTES = 2_000_000;

export type CommunityImageVariant = "original" | "thumbnail";

export function communityImageVariant(requestUrl: string): CommunityImageVariant {
  try {
    return new URL(requestUrl).searchParams.get("variant") === "thumbnail"
      ? "thumbnail"
      : "original";
  } catch {
    return "original";
  }
}

export function publicCommunityImageHeaders(contentType: string) {
  return {
    "Cache-Control": "public, max-age=300, must-revalidate",
    "CDN-Cache-Control": "public, max-age=300",
    "Vercel-CDN-Cache-Control": "public, max-age=300, stale-if-error=3600",
    "Content-Type": contentType,
    "X-Content-Type-Options": "nosniff"
  };
}

export async function createCommunityThumbnail(source: Buffer) {
  if (source.byteLength > MAX_COMMUNITY_IMAGE_SOURCE_BYTES) {
    throw new Error("Community image source exceeds the thumbnail safety limit.");
  }

  return sharp(source, { failOn: "error", limitInputPixels: 50_000_000 })
    .rotate()
    .resize({
      width: COMMUNITY_THUMBNAIL_MAX_DIMENSION,
      height: COMMUNITY_THUMBNAIL_MAX_DIMENSION,
      fit: "inside",
      withoutEnlargement: true
    })
    .webp({ quality: COMMUNITY_THUMBNAIL_QUALITY, effort: 3 })
    .toBuffer();
}
