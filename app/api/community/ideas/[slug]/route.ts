import { getCommunitySession, refreshCommunitySessionCookieIfNeeded } from "@/lib/server/community-auth";
import { permanentlyDeleteCommunityIdeaOwner, updateCommunityIdeaOwner } from "@/lib/server/community-store";
import { fail, messageFromError, ok } from "@/lib/server/api-response";
import { isIdeaNotFoundError } from "@/lib/server/idea-access-policy";

export async function PATCH(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const session = await getCommunitySession();
  if (!session) return fail("Email login is required.", 401);
  const { slug } = await params;
  try {
    return refreshCommunitySessionCookieIfNeeded(ok(await updateCommunityIdeaOwner(slug, await request.json(), session.userId)), session);
  } catch (error) {
    if (isIdeaNotFoundError(error)) return fail("Not found.", 404);
    return fail(messageFromError(error, "Unable to edit discussion."), 400);
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const session = await getCommunitySession();
  if (!session) return fail("Email login is required.", 401);
  const { slug } = await params;
  try {
    return refreshCommunitySessionCookieIfNeeded(ok(await permanentlyDeleteCommunityIdeaOwner(slug, session.userId, request)), session);
  } catch (error) {
    if (isIdeaNotFoundError(error)) return fail("Not found.", 404);
    return fail(messageFromError(error, "Unable to permanently delete discussion."), 400);
  }
}
