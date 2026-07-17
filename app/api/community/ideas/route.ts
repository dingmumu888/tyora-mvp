import { CommunityFeedSort } from "@/lib/community";
import { getCommunitySession, refreshCommunitySessionCookieIfNeeded } from "@/lib/server/community-auth";
import { createCommunityIdea, countReviewsUsedToday, getCommunityIdeas } from "@/lib/server/community-store";
import { fail, messageFromError, ok } from "@/lib/server/api-response";
import { getContent } from "@/lib/server/data-store";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const sort = params.get("sort") as CommunityFeedSort | null;
  const limit = Number(params.get("limit") || 50);
  return ok(await getCommunityIdeas(sort || "newest", {}, limit), {
    headers: {
      "Cache-Control": "public, max-age=30, s-maxage=60, stale-while-revalidate=120"
    }
  });
}

export async function POST(request: Request) {
  const session = await getCommunitySession();
  if (!session) return fail("Email login is required to post an idea.", 401);
  try {
    const content = await getContent();
    const used = await countReviewsUsedToday(session.userId);
    if (used >= content.communityPage.dailyAssessmentLimit) {
      return fail("Today's initial assessment limit has been reached. Community discussion remains available.", 429);
    }
    return refreshCommunitySessionCookieIfNeeded(ok(await createCommunityIdea(await request.json(), session.userId)), session);
  } catch (error) {
    return fail(messageFromError(error, "Unable to create idea."), 400);
  }
}
