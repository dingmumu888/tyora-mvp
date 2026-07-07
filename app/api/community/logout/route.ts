import { NextResponse } from "next/server";
import { clearCommunitySessionCookie } from "@/lib/server/community-auth";

export async function POST() {
  return clearCommunitySessionCookie(NextResponse.json({ success: true }));
}
