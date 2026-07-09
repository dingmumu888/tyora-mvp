import { NextResponse } from "next/server";
import { getCommunitySession } from "@/lib/server/community-auth";
import { getCommunityIdeaImage } from "@/lib/server/community-store";

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string; index: string }> }) {
  const session = await getCommunitySession();
  const { slug, index } = await params;
  const image = await getCommunityIdeaImage(slug, Number(index), { viewerId: session?.userId });
  if (!image) return new Response("Image not found.", { status: 404 });

  if ("redirectUrl" in image) {
    return NextResponse.redirect(image.redirectUrl, 302);
  }

  return new Response(image.body, {
    headers: {
      "Content-Type": image.contentType,
      "Cache-Control": "public, max-age=31536000, immutable"
    }
  });
}
