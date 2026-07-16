import { hasAdminSession } from "@/lib/server/admin-auth";
import { getCommunitySession } from "@/lib/server/community-auth";
import type { IdeaAccessContext } from "@/lib/server/idea-access-policy";

export async function getCurrentIdeaAccessContext(): Promise<IdeaAccessContext> {
  const [communitySession, isAdmin] = await Promise.all([
    getCommunitySession(),
    hasAdminSession().catch(() => false)
  ]);
  return {
    userId: communitySession?.userId,
    isAdmin
  };
}
