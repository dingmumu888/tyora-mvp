import { requireAdminSession } from "@/lib/server/admin-auth";
import { getCommunityIdeas } from "@/lib/server/community-store";
import { ok } from "@/lib/server/api-response";

export async function GET() {
  const unauthorized = await requireAdminSession();
  if (unauthorized) return unauthorized;
  return ok(await getCommunityIdeas("recently-active", { isAdmin: true }));
}
