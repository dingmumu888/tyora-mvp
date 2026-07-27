import { getCommunitySession, refreshCommunitySessionCookieIfNeeded } from "@/lib/server/community-auth";
import { getCommunityIdeaBySlug, getCommunityReactionState, toggleCommunityReaction } from "@/lib/server/community-store";
import { fail, messageFromError, ok } from "@/lib/server/api-response";
import { getCurrentIdeaAccessContext } from "@/lib/server/idea-access-context";
import { isIdeaNotFoundError } from "@/lib/server/idea-access-policy";
import { CommunityActionPolicyError } from "@/lib/server/community-action-policy";

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const session = await getCommunitySession();
  const { slug } = await params;
  if (!session) {
    return await getCommunityIdeaBySlug(slug)
      ? ok({ liked: false, interested: false })
      : fail("Not found.", 404);
  }
  try {
    return refreshCommunitySessionCookieIfNeeded(ok(await getCommunityReactionState(slug, session.userId, await getCurrentIdeaAccessContext())), session);
  } catch (error) {
    if (isIdeaNotFoundError(error)) return fail("Not found.", 404);
    return fail(messageFromError(error, "Unable to load reaction state."), 400);
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const session = await getCommunitySession();
  const { slug } = await params;
  if (!session) {
    return await getCommunityIdeaBySlug(slug)
      ? fail("Email login is required.", 401)
      : fail("Not found.", 404);
  }
  const body = await request.json() as { type?: "Like" | "Interested" };
  if (body.type !== "Like" && body.type !== "Interested") return fail("Invalid reaction.", 400);
  try {
    return refreshCommunitySessionCookieIfNeeded(ok(await toggleCommunityReaction(slug, body.type, session.userId, request, await getCurrentIdeaAccessContext())), session);
  } catch (error) {
    if (isIdeaNotFoundError(error)) return fail("Not found.", 404);
    if (error instanceof CommunityActionPolicyError) return fail(error.message, error.status);
    return fail(messageFromError(error, "Unable to update reaction."), 400);
  }
}
