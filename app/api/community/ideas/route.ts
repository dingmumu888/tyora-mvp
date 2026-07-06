import { CommunityFeedSort } from "@/lib/community";
import { getCommunitySession } from "@/lib/server/community-auth";
import { createCommunityIdea, countReviewsUsedToday, getCommunityIdeas } from "@/lib/server/community-store";
import { fail, messageFromError, ok } from "@/lib/server/api-response";

export async function GET(request: Request) {
  const sort = new URL(request.url).searchParams.get("sort") as CommunityFeedSort | null;
  return ok(await getCommunityIdeas(sort || "newest"));
}

export async function POST(request: Request) {
  const session = await getCommunitySession();
  if (!session) return fail("Email login is required to post an idea.", 401);
  try {
    const used = await countReviewsUsedToday(session.userId);
    if (used >= 3) {
      return fail("Today's FREE Expert Reviews: 3 / 3 used. Community discussion is unlimited.", 429);
    }
    return ok(await createCommunityIdea(await request.json(), session.userId));
  } catch (error) {
    return fail(messageFromError(error, "Unable to create idea."), 400);
  }
}
