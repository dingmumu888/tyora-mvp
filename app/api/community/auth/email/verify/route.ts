import { NextResponse } from "next/server";
import { setCommunitySessionCookie } from "@/lib/server/community-auth";
import { verifyEmailLoginCode } from "@/lib/server/email-login";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({})) as { email?: string; code?: string };
  const user = await verifyEmailLoginCode(body.email, body.code);

  if (!user) {
    return NextResponse.json({ success: false, message: "Invalid or expired code." }, { status: 400 });
  }

  const response = NextResponse.json({
    success: true,
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      name: user.name
    }
  });

  return setCommunitySessionCookie(response, {
    userId: user.id,
    email: user.email,
    name: user.name
  });
}
