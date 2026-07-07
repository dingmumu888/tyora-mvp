import { NextResponse } from "next/server";
import { getCommunitySession, refreshCommunitySessionCookieIfNeeded } from "@/lib/server/community-auth";
import { getCommunityNotificationCount, getCommunityUser, updateCommunityProfile } from "@/lib/server/community-store";

export async function GET() {
  const session = await getCommunitySession();
  const user = session ? await getCommunityUser(session.userId) : null;
  const notificationCount = session && user ? await getCommunityNotificationCount(session.userId) : 0;
  const response = NextResponse.json({ authenticated: Boolean(user), user, notificationCount });
  return session && user ? refreshCommunitySessionCookieIfNeeded(response, session) : response;
}

export async function PUT(request: Request) {
  const session = await getCommunitySession();
  if (!session) {
    return NextResponse.json({ success: false, message: "Email login is required." }, { status: 401 });
  }

  try {
    const user = await updateCommunityProfile(session.userId, await request.json().catch(() => ({})));
    return refreshCommunitySessionCookieIfNeeded(NextResponse.json({ success: true, user }), session);
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : "Unable to save profile."
    }, { status: 400 });
  }
}
