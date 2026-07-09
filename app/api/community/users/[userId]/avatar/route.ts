import { NextResponse } from "next/server";
import { getCommunityUserAvatar } from "@/lib/server/community-store";

export async function GET(_request: Request, { params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  const avatar = await getCommunityUserAvatar(userId);

  if (!avatar) {
    return new Response("Avatar not found.", { status: 404 });
  }

  if ("redirectUrl" in avatar) {
    return NextResponse.redirect(avatar.redirectUrl, 302);
  }

  return new Response(avatar.body, {
    headers: {
      "Content-Type": avatar.contentType,
      "Cache-Control": "public, max-age=31536000, immutable"
    }
  });
}
