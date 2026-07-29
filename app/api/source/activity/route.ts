import { fail, messageFromError, ok } from "@/lib/server/api-response";
import { getPublicSourceActivities } from "@/lib/server/source-store";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    return ok(await getPublicSourceActivities(), {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300"
      }
    });
  } catch (error) {
    return fail(messageFromError(error, "Unable to load recent sourcing activity."));
  }
}
