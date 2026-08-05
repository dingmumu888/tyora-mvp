import { getCommunitySession, refreshCommunitySessionCookieIfNeeded } from "@/lib/server/community-auth";
import { addCommunityPrivateFollowUp, getCommunityPrivateFollowUpsForOwner } from "@/lib/server/community-store";
import { fail, messageFromError, ok } from "@/lib/server/api-response";
import { CommunityActionPolicyError } from "@/lib/server/community-action-policy";
import { isIdeaNotFoundError } from "@/lib/server/idea-access-policy";

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const session = await getCommunitySession();
  if (!session) return fail("Email login is required.", 401);
  const { slug } = await params;
  try {
    return refreshCommunitySessionCookieIfNeeded(ok(await getCommunityPrivateFollowUpsForOwner(slug, session.userId)), session);
  } catch (error) {
    if (isIdeaNotFoundError(error)) return fail("Not found.", 404);
    return fail(messageFromError(error, "Unable to load private follow-ups."), 400);
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const session = await getCommunitySession();
  if (!session) return fail("Email login is required.", 401);
  const { slug } = await params;
  try {
    return refreshCommunitySessionCookieIfNeeded(
      ok(await addCommunityPrivateFollowUp(slug, await request.json(), session.userId, request)),
      session
    );
  } catch (error) {
    if (isIdeaNotFoundError(error)) return fail("Not found.", 404);
    if (error instanceof CommunityActionPolicyError) return fail(error.message, error.status);
    return fail(messageFromError(error, "Unable to send private follow-up."), 400);
  }
}
