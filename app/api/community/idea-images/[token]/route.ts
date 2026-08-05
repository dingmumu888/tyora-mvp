import { NextResponse } from "next/server";
import { fail } from "@/lib/server/api-response";
import { getCommunitySession, refreshCommunitySessionCookieIfNeeded } from "@/lib/server/community-auth";
import { verifyCommunityImageUploadToken } from "@/lib/server/community-image-upload-token";
import { prisma } from "@/lib/server/db";
import { createPrivateSignedUrl } from "@/lib/server/private-storage";

export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  const session = await getCommunitySession();
  if (!session) return fail("Not found.", 404);
  try {
    const { token } = await params;
    const payload = verifyCommunityImageUploadToken(token, session.userId);
    const receipt = await prisma.communityActionReceipt.findFirst({
      where: {
        id: payload.receiptId,
        userId: session.userId,
        action: "idea-image-upload",
        resourceId: payload.objectPath,
        expiresAt: { gt: new Date() }
      },
      select: { id: true }
    });
    if (!receipt) return fail("Not found.", 404);
    const response = NextResponse.redirect(await createPrivateSignedUrl(payload.objectPath));
    response.headers.set("Cache-Control", "private, no-store");
    return refreshCommunitySessionCookieIfNeeded(response, session);
  } catch {
    return fail("Not found.", 404);
  }
}
