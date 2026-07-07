import { getCommunitySession, refreshCommunitySessionCookieIfNeeded } from "@/lib/server/community-auth";
import { toggleCommunityReaction } from "@/lib/server/community-store";
import { fail, messageFromError, ok } from "@/lib/server/api-response";

export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const session = await getCommunitySession();
  if (!session) return fail("Email login is required.", 401);
  const { slug } = await params;
  const body = await request.json() as { type?: "Like" | "Interested" };
  if (body.type !== "Like" && body.type !== "Interested") return fail("Invalid reaction.", 400);
  try {
    return refreshCommunitySessionCookieIfNeeded(ok(await toggleCommunityReaction(slug, body.type, session.userId)), session);
  } catch (error) {
    return fail(messageFromError(error, "Unable to update reaction."), 400);
  }
}
