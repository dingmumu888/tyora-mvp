import { requireAdminSession } from "@/lib/server/admin-auth";
import { getCommunityIdeas, getCommunityPrivateFollowUpsAdmin, getCommunityRemovalNotices } from "@/lib/server/community-store";
import { ok } from "@/lib/server/api-response";

export async function GET() {
  const unauthorized = await requireAdminSession();
  if (unauthorized) return unauthorized;
  const [ideas, removalNotices, privateFollowUps] = await Promise.all([
    getCommunityIdeas("newest", { isAdmin: true }),
    getCommunityRemovalNotices(),
    getCommunityPrivateFollowUpsAdmin()
  ]);
  return ok({ ideas, removalNotices, privateFollowUps });
}
