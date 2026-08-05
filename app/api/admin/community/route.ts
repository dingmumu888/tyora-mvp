import { requireAdminSession } from "@/lib/server/admin-auth";
import { getCommunityIdeas, getCommunityRemovalNotices } from "@/lib/server/community-store";
import { ok } from "@/lib/server/api-response";

export async function GET() {
  const unauthorized = await requireAdminSession();
  if (unauthorized) return unauthorized;
  const [ideas, removalNotices] = await Promise.all([
    getCommunityIdeas("recently-active", { isAdmin: true }),
    getCommunityRemovalNotices()
  ]);
  return ok({ ideas, removalNotices });
}
