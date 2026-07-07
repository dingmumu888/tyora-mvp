import { NextResponse } from "next/server";
import { getCommunitySession, refreshCommunitySessionCookieIfNeeded } from "@/lib/server/community-auth";
import { markCommunityNotificationsRead } from "@/lib/server/community-store";

export async function POST() {
  const session = await getCommunitySession();
  if (!session) {
    return NextResponse.json({ success: false, message: "Email login is required." }, { status: 401 });
  }

  await markCommunityNotificationsRead(session.userId);
  return refreshCommunitySessionCookieIfNeeded(NextResponse.json({ success: true, notificationCount: 0 }), session);
}
