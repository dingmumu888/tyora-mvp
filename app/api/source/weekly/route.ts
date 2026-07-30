import { fail, messageFromError, ok } from "@/lib/server/api-response";
import { getPublicWeeklySourceProducts } from "@/lib/server/source-weekly-store";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    return ok(await getPublicWeeklySourceProducts(), {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=180"
      }
    });
  } catch (error) {
    return fail(messageFromError(error, "Unable to load this week's products."));
  }
}
