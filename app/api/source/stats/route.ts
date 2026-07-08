import { fail, messageFromError, ok } from "@/lib/server/api-response";
import { getSourceRequestStats } from "@/lib/server/source-store";

export async function GET() {
  try {
    return ok(await getSourceRequestStats(), {
      headers: {
        "Cache-Control": "public, max-age=60, s-maxage=120, stale-while-revalidate=300"
      }
    });
  } catch (error) {
    return fail(messageFromError(error, "Unable to load source stats."));
  }
}
