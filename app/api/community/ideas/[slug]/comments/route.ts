import { getCommunitySession, refreshCommunitySessionCookieIfNeeded } from "@/lib/server/community-auth";
import { addCommunityComment, getCommunityIdeaBySlug } from "@/lib/server/community-store";
import { fail, messageFromError, ok } from "@/lib/server/api-response";
import { getCurrentIdeaAccessContext } from "@/lib/server/idea-access-context";
import { isIdeaNotFoundError } from "@/lib/server/idea-access-policy";
import { CommunityActionPolicyError } from "@/lib/server/community-action-policy";

export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const session = await getCommunitySession();
  const { slug } = await params;
  if (!session) {
    return await getCommunityIdeaBySlug(slug)
      ? fail("Email login is required to comment.", 401)
      : fail("Not found.", 404);
  }
  try {
    const context = await getCurrentIdeaAccessContext();
    return refreshCommunitySessionCookieIfNeeded(ok(await addCommunityComment(slug, await request.json(), session.userId, request, context)), session);
  } catch (error) {
    if (isIdeaNotFoundError(error)) return fail("Not found.", 404);
    if (error instanceof CommunityActionPolicyError) return fail(error.message, error.status);
    return fail(messageFromError(error, "Unable to add comment."), 400);
  }
}
