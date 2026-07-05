import { NextResponse } from "next/server";
import { getCommunitySession } from "@/lib/server/community-auth";
import { getCommunityUser } from "@/lib/server/community-store";

export async function GET() {
  const session = await getCommunitySession();
  const user = session ? await getCommunityUser(session.userId) : null;
  return NextResponse.json({ authenticated: Boolean(user), user });
}
