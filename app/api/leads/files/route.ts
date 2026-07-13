import { NextResponse } from "next/server";

import { fail } from "@/lib/server/api-response";
import { requireAdminSession } from "@/lib/server/admin-auth";
import { isAllowedPrivateObjectPath } from "@/lib/server/private-storage-policy";
import { createPrivateSignedUrl } from "@/lib/server/private-storage";

export const runtime = "nodejs";

const allowedContentTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf"
]);

export async function GET(request: Request) {
  const unauthorized = await requireAdminSession();
  if (unauthorized) return unauthorized;

  const objectPath = new URL(request.url).searchParams.get("path") || "";
  if (!isAllowedPrivateObjectPath(objectPath)) {
    return fail("Invalid private file path.", 400);
  }

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
        "Cache-Control": "private, no-store, max-age=0, must-revalidate",
        "Content-Disposition": `inline; filename="tyora-private-file${extension}"`,
        "Content-Type": contentType,
        Pragma: "no-cache",
        "X-Content-Type-Options": "nosniff"
      }
    });
  } catch {
    return fail("Private file access is unavailable.", 503);
  }
}
