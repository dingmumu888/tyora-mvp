import { fail, messageFromError, ok } from "@/lib/server/api-response";
import { getCommunitySession, refreshCommunitySessionCookieIfNeeded } from "@/lib/server/community-auth";
import { createCustomInquiry, getCustomInquiriesForUser } from "@/lib/server/custom-inquiry-store";

export async function GET() {
  const session = await getCommunitySession();
  if (!session) return fail("Email login is required.", 401);
  return refreshCommunitySessionCookieIfNeeded(
    ok(await getCustomInquiriesForUser(session.userId), {
      headers: { "Cache-Control": "private, no-store" }
    }),
    session
  );
}

export async function POST(request: Request) {
  const session = await getCommunitySession();
  if (!session) return fail("Email login is required to submit a private Custom inquiry.", 401);
  try {
    const inquiry = await createCustomInquiry(await request.json(), session.userId, session.email);
    return refreshCommunitySessionCookieIfNeeded(ok(inquiry, {
      headers: { "Cache-Control": "private, no-store" }
    }), session);
  } catch (error) {
    return fail(messageFromError(error, "Unable to submit private Custom inquiry."), 400);
  }
}
