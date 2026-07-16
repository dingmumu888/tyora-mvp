import { NextResponse } from "next/server";
import { getCommunityIdeaImage } from "@/lib/server/community-store";
import { getCurrentIdeaAccessContext } from "@/lib/server/idea-access-context";
import { createPrivateSignedUrl } from "@/lib/server/private-storage";
import { isAllowedPrivateObjectPath } from "@/lib/server/private-storage-policy";

export const runtime = "nodejs";

const privateHeaders = {
  "Cache-Control": "private, no-store",
  Pragma: "no-cache",
  "X-Content-Type-Options": "nosniff"
};

const allowedContentTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

function notFound() {
  return new NextResponse("Not found.", { status: 404, headers: privateHeaders });
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string; index: string }> }
) {
  const { slug, index } = await params;
  const image = await getCommunityIdeaImage(
    slug,
    Number(index),
    await getCurrentIdeaAccessContext()
  );
  if (!image || image.access !== "private") return notFound();

  if ("body" in image) {
    if (!allowedContentTypes.has(image.contentType)) return notFound();
    return new NextResponse(new Uint8Array(image.body), {
      status: 200,
      headers: { ...privateHeaders, "Content-Type": image.contentType }
    });
  }

  if (!("objectPath" in image) || !isAllowedPrivateObjectPath(image.objectPath)) {
    return notFound();
  }

  try {
    const signedUrl = await createPrivateSignedUrl(image.objectPath, 120);
    const storageResponse = await fetch(signedUrl, {
      method: "GET",
      cache: "no-store",
      redirect: "error"
    });
    if (!storageResponse.ok || !storageResponse.body) {
      return new NextResponse("Private image access is unavailable.", {
        status: 503,
        headers: privateHeaders
      });
    }
    const contentType = storageResponse.headers.get("content-type")?.split(";", 1)[0]?.trim().toLowerCase() || "";
    if (!allowedContentTypes.has(contentType)) return notFound();
    return new NextResponse(storageResponse.body, {
      status: 200,
      headers: { ...privateHeaders, "Content-Type": contentType }
    });
  } catch {
    return new NextResponse("Private image access is unavailable.", {
      status: 503,
      headers: privateHeaders
    });
  }
}
