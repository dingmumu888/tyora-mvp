import { fail, messageFromError, ok } from "@/lib/server/api-response";
import { getCommunitySession, refreshCommunitySessionCookieIfNeeded } from "@/lib/server/community-auth";
import { CommunityActionPolicyError } from "@/lib/server/community-action-policy";
import { getCurrentIdeaAccessContext } from "@/lib/server/idea-access-context";
import { isIdeaNotFoundError } from "@/lib/server/idea-access-policy";
import { getCommunityIdeaBySlug, recordCommunityShare } from "@/lib/server/community-store";

export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const session = await getCommunitySession();
  const { slug } = await params;
  if (!session) {
    return await getCommunityIdeaBySlug(slug)
      ? fail("Email login is required to record a share.", 401)
      : fail("Not found.", 404);
  }
  try {
    const body = await request.json() as { channel?: string };
    const data = await recordCommunityShare(
      slug,
      body.channel,
      session.userId,
      request,
      await getCurrentIdeaAccessContext()
    );
    return refreshCommunitySessionCookieIfNeeded(ok(data), session);
  } catch (error) {
    if (isIdeaNotFoundError(error)) return fail("Not found.", 404);
    if (error instanceof CommunityActionPolicyError) return fail(error.message, error.status);
    return fail(messageFromError(error, "Unable to record share."), 400);
  }
}
