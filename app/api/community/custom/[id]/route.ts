import { fail, ok } from "@/lib/server/api-response";
import { hasAdminSession } from "@/lib/server/admin-auth";
import { getCommunitySession, refreshCommunitySessionCookieIfNeeded } from "@/lib/server/community-auth";
import { CustomInquiryNotFoundError } from "@/lib/server/custom-inquiry-policy";
import { getCustomInquiry } from "@/lib/server/custom-inquiry-store";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const [session, isAdmin] = await Promise.all([
    getCommunitySession(),
    hasAdminSession().catch(() => false)
  ]);
  if (!session && !isAdmin) return fail("Not found.", 404);
  try {
    const { id } = await params;
    const response = ok(await getCustomInquiry(id, {
      userId: session?.userId,
      isAdmin
    }), { headers: { "Cache-Control": "private, no-store" } });
    return session ? refreshCommunitySessionCookieIfNeeded(response, session) : response;
  } catch (error) {
    if (error instanceof CustomInquiryNotFoundError) return fail("Not found.", 404);
    return fail("Unable to load Custom inquiry.", 503);
  }
}
