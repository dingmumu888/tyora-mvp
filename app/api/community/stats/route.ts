import { ok } from "@/lib/server/api-response";
import { getCommunityStats } from "@/lib/server/community-store";

export async function GET() {
  return ok(await getCommunityStats(), {
    headers: { "Cache-Control": "public, max-age=30, s-maxage=60, stale-while-revalidate=120" }
  });
}
