import { getCommunitySession, refreshCommunitySessionCookieIfNeeded } from "@/lib/server/community-auth";
import { deleteCommunityCommentOwner, getCommunityIdeaBySlug, toggleCommunityCommentReaction } from "@/lib/server/community-store";
import { fail, messageFromError, ok } from "@/lib/server/api-response";
import { getCurrentIdeaAccessContext } from "@/lib/server/idea-access-context";
import { isIdeaNotFoundError } from "@/lib/server/idea-access-policy";

export async function DELETE(_request: Request, { params }: { params: Promise<{ slug: string; commentId: string }> }) {
  const session = await getCommunitySession();
  const { slug, commentId } = await params;
  if (!session) return await getCommunityIdeaBySlug(slug) ? fail("Email login is required.", 401) : fail("Not found.", 404);
  try {
    return refreshCommunitySessionCookieIfNeeded(ok(await deleteCommunityCommentOwner(slug, commentId, session.userId)), session);
  } catch (error) {
    if (isIdeaNotFoundError(error)) return fail("Not found.", 404);
    return fail(messageFromError(error, "Unable to delete comment."), 400);
  }
}

export async function PATCH(_request: Request, { params }: { params: Promise<{ slug: string; commentId: string }> }) {
  const session = await getCommunitySession();
  const { slug, commentId } = await params;
  if (!session) return await getCommunityIdeaBySlug(slug) ? fail("Email login is required.", 401) : fail("Not found.", 404);
  try {
    return refreshCommunitySessionCookieIfNeeded(ok(await toggleCommunityCommentReaction(slug, commentId, session.userId, await getCurrentIdeaAccessContext())), session);
  } catch (error) {
    if (isIdeaNotFoundError(error)) return fail("Not found.", 404);
    return fail(messageFromError(error, "Unable to update comment reaction."), 400);
  }
}
