import { NextResponse } from "next/server";

import { fail } from "@/lib/server/api-response";
import { hasAdminSession } from "@/lib/server/admin-auth";
import { isAllowedPrivateLeadObjectPath } from "@/lib/server/private-storage-policy";
import { createPrivateSignedUrl } from "@/lib/server/private-storage";

export const runtime = "nodejs";

const allowedContentTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf"
]);

const privateHeaders = {
  "Cache-Control": "private, no-store",
  Pragma: "no-cache",
  "X-Content-Type-Options": "nosniff"
};

function notFound() {
  return new NextResponse("Not found.", { status: 404, headers: privateHeaders });
}

export async function GET(request: Request) {
  if (!(await hasAdminSession().catch(() => false))) return notFound();

  const objectPath = new URL(request.url).searchParams.get("path") || "";
  if (!isAllowedPrivateLeadObjectPath(objectPath)) return notFound();

  try {
    const signedUrl = await createPrivateSignedUrl(objectPath, 120);
    const storageResponse = await fetch(signedUrl, {
      method: "GET",
      cache: "no-store",
      redirect: "error"
    });
    if (!storageResponse.ok || !storageResponse.body) {
      return fail("Private file access is unavailable.", 503);
    }

    const suppliedContentType = storageResponse.headers
      .get("content-type")
      ?.split(";", 1)[0]
      ?.trim()
      .toLowerCase();
    const contentType =
      suppliedContentType && allowedContentTypes.has(suppliedContentType)
        ? suppliedContentType
        : "application/octet-stream";
    const extension = objectPath.match(/\.(jpg|jpeg|png|webp|pdf)$/i)?.[0].toLowerCase() || "";

    return new NextResponse(storageResponse.body, {
      status: 200,
      headers: {
        ...privateHeaders,
        "Content-Disposition": `inline; filename="tyora-private-file${extension}"`,
        "Content-Type": contentType
      }
    });
  } catch {
    return fail("Private file access is unavailable.", 503);
  }
}
