import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import sharp from "sharp";

import { communityThumbnailUrl } from "../lib/community-image-url.ts";
import {
  COMMUNITY_THUMBNAIL_MAX_DIMENSION,
  createCommunityThumbnail,
  publicCommunityImageHeaders
} from "../lib/server/community-image-delivery.ts";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("community thumbnails are constrained, compressed WebP derivatives", async () => {
  const source = await sharp({
    create: {
      width: 1600,
      height: 1200,
      channels: 3,
      background: { r: 38, g: 104, b: 181 }
    }
  }).png().toBuffer();

  const thumbnail = await createCommunityThumbnail(source);
  const metadata = await sharp(thumbnail).metadata();

  assert.equal(metadata.format, "webp");
  assert.ok((metadata.width || 0) <= COMMUNITY_THUMBNAIL_MAX_DIMENSION);
  assert.ok((metadata.height || 0) <= COMMUNITY_THUMBNAIL_MAX_DIMENSION);
  assert.ok(thumbnail.byteLength < source.byteLength);
});

test("thumbnail URLs preserve safe version parameters and select the fixed derivative", () => {
  assert.equal(
    communityThumbnailUrl("/api/community/ideas/test-idea/images/0?v=abc123"),
    "/api/community/ideas/test-idea/images/0?v=abc123&variant=thumbnail"
  );
  assert.equal(communityThumbnailUrl("https://images.example.com/product.jpg"), "https://images.example.com/product.jpg");
  assert.equal(communityThumbnailUrl("/api/community/private-ideas/test-idea/images/0"), "/api/community/private-ideas/test-idea/images/0");
});

test("public community images use short browser and Vercel edge caching", () => {
  const headers = publicCommunityImageHeaders("image/webp");
  assert.match(headers["Cache-Control"], /max-age=300/);
  assert.match(headers["Vercel-CDN-Cache-Control"], /max-age=300/);
  assert.doesNotMatch(headers["Cache-Control"], /immutable/);
});

test("feed and detail cards request thumbnails without pre-rendering nine mobile images", async () => {
  const [feed, rail, image, detail, route] = await Promise.all([
    read("app/ask/page.tsx"),
    read("components/community-card-image-rail.tsx"),
    read("components/community-image.tsx"),
    read("app/ask/[slug]/idea-image-gallery.tsx"),
    read("app/api/community/ideas/[slug]/images/[index]/route.ts")
  ]);

  assert.match(feed, /thumbnail=\{!story\}/);
  assert.match(feed, /priority=\{index === 0\}/);
  assert.match(rail, /const coverImage = images\[0\]/);
  assert.doesNotMatch(rail, /images\.length \? images : \[undefined\]/);
  assert.match(image, /communityThumbnailUrl/);
  assert.match(image, /fetchPriority/);
  assert.match(image, /image\?\.complete && image\.naturalWidth > 0/);
  assert.match(image, /ref=\{imageRef\}/);
  assert.match(detail, /thumbnail[\s\S]+priority=\{index === 0\}/);
  assert.match(route, /createCommunityThumbnail/);
  assert.match(route, /communityImageVariant/);
});
