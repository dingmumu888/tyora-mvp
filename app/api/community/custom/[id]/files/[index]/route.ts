import { NextResponse } from "next/server";
import { hasAdminSession } from "@/lib/server/admin-auth";
import { getCommunitySession } from "@/lib/server/community-auth";
import { CustomInquiryNotFoundError } from "@/lib/server/custom-inquiry-policy";
import { getCustomInquiryFile } from "@/lib/server/custom-inquiry-store";
import { createPrivateSignedUrl } from "@/lib/server/private-storage";

export const runtime = "nodejs";

const privateHeaders = {
  "Cache-Control": "private, no-store",
  Pragma: "no-cache",
  "X-Content-Type-Options": "nosniff"
};
const allowedContentTypes = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);

function notFound() {
  return new NextResponse("Not found.", { status: 404, headers: privateHeaders });
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; index: string }> }
) {
  const [session, isAdmin] = await Promise.all([
    getCommunitySession(),
    hasAdminSession().catch(() => false)
  ]);
  if (!session && !isAdmin) return notFound();
  try {
    const { id, index } = await params;
    const file = await getCustomInquiryFile(id, Number(index), {
      userId: session?.userId,
      isAdmin
    });
    if (!file) return notFound();
    const signedUrl = await createPrivateSignedUrl(file.objectPath, 120);
    const response = await fetch(signedUrl, { method: "GET", cache: "no-store", redirect: "error" });
    if (!response.ok || !response.body) {
      return new NextResponse("Private file access is unavailable.", { status: 503, headers: privateHeaders });
    }
    const suppliedType = response.headers.get("content-type")?.split(";", 1)[0]?.trim().toLowerCase() || "";
    const contentType = allowedContentTypes.has(suppliedType) ? suppliedType : file.mimeType;
    if (!allowedContentTypes.has(contentType)) return notFound();
    const extension = file.name.match(/\.(jpg|jpeg|png|webp|pdf)$/i)?.[0].toLowerCase() || "";
    return new NextResponse(response.body, {
      headers: {
        ...privateHeaders,
        "Content-Type": contentType,
        "Content-Disposition": `inline; filename="tyora-custom-file${extension}"`
      }
    });
  } catch (error) {
    if (error instanceof CustomInquiryNotFoundError) return notFound();
    return new NextResponse("Private file access is unavailable.", { status: 503, headers: privateHeaders });
  }
}
