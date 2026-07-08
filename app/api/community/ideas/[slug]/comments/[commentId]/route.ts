import { getCommunitySession, refreshCommunitySessionCookieIfNeeded } from "@/lib/server/community-auth";
import { deleteCommunityCommentOwner } from "@/lib/server/community-store";
import { fail, messageFromError, ok } from "@/lib/server/api-response";

export async function DELETE(_request: Request, { params }: { params: Promise<{ slug: string; commentId: string }> }) {
  const session = await getCommunitySession();
  if (!session) return fail("Email login is required.", 401);
  const { slug, commentId } = await params;
  try {
    return refreshCommunitySessionCookieIfNeeded(ok(await deleteCommunityCommentOwner(slug, commentId, session.userId)), session);
  } catch (error) {
    return fail(messageFromError(error, "Unable to delete comment."), 400);
  }
}
