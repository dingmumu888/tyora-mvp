import { NextResponse } from "next/server";
import { getCommunityIdeaImage } from "@/lib/server/community-store";
import {
  communityImageVariant,
  createCommunityThumbnail,
  publicCommunityImageHeaders
} from "@/lib/server/community-image-delivery";
import { createPrivateSignedUrl } from "@/lib/server/private-storage";
import { isAllowedPrivateObjectPath } from "@/lib/server/private-storage-policy";

export const runtime = "nodejs";

const privateNotFoundHeaders = {
  "Cache-Control": "private, no-store",
  Pragma: "no-cache",
  "X-Content-Type-Options": "nosniff"
};

const allowedContentTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

async function thumbnailResponse(source: Buffer) {
  const thumbnail = await createCommunityThumbnail(source);
  return new NextResponse(new Uint8Array(thumbnail), {
    status: 200,
    headers: publicCommunityImageHeaders("image/webp")
  });
}

export async function GET(request: Request, { params }: { params: Promise<{ slug: string; index: string }> }) {
  const { slug, index } = await params;
  const variant = communityImageVariant(request.url);
  const image = await getCommunityIdeaImage(slug, Number(index));
  if (!image || image.access !== "public") {
    return new Response("Not found.", { status: 404, headers: privateNotFoundHeaders });
  }

  if ("redirectUrl" in image) {
    return NextResponse.redirect(image.redirectUrl, 302);
  }

  if ("objectPath" in image) {
    if (!isAllowedPrivateObjectPath(image.objectPath)) {
      return new Response("Not found.", { status: 404, headers: privateNotFoundHeaders });
    }
    try {
      const signedUrl = await createPrivateSignedUrl(image.objectPath, 120);
      const storageResponse = await fetch(signedUrl, { method: "GET", cache: "no-store", redirect: "error" });
      if (!storageResponse.ok || !storageResponse.body) {
        return new Response("Image access is unavailable.", { status: 503 });
      }
      const contentType = storageResponse.headers.get("content-type")?.split(";", 1)[0]?.trim().toLowerCase() || "";
      if (!allowedContentTypes.has(contentType)) {
        return new Response("Not found.", { status: 404, headers: privateNotFoundHeaders });
      }
      if (variant === "thumbnail") {
        return await thumbnailResponse(Buffer.from(await storageResponse.arrayBuffer()));
      }
      return new NextResponse(storageResponse.body, {
        status: 200,
        headers: publicCommunityImageHeaders(contentType)
      });
    } catch {
      return new Response("Image access is unavailable.", { status: 503 });
    }
  }

  if (variant === "thumbnail") return thumbnailResponse(image.body);

  return new Response(new Uint8Array(image.body), {
    headers: publicCommunityImageHeaders(image.contentType)
  });
}
