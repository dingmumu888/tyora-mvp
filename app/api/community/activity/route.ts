import { getCommunityActivity } from "@/lib/server/community-store";
import { fail, messageFromError, ok } from "@/lib/server/api-response";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const limit = Number(params.get("limit") || 8);
  try {
    return ok(await getCommunityActivity(limit), {
      headers: {
        "Cache-Control": "public, max-age=10, s-maxage=20, stale-while-revalidate=60"
      }
    });
  } catch (error) {
    return fail(messageFromError(error, "Unable to load community activity."), 400);
  }
}
