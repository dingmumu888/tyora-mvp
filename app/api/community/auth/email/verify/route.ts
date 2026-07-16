import { NextResponse } from "next/server";
import { setCommunitySessionCookie } from "@/lib/server/community-auth";
import { verifyEmailLoginCode } from "@/lib/server/email-login";
import { recordCommunityUserLogin } from "@/lib/server/customer-store";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({})) as { email?: string; code?: string };
  let user: Awaited<ReturnType<typeof verifyEmailLoginCode>>;
  try {
    user = await verifyEmailLoginCode(body.email, body.code, request);
  } catch {
    return NextResponse.json(
      { success: false, message: "Email login is temporarily unavailable." },
      { status: 503 }
    );
  }

  if (!user) {
    return NextResponse.json({ success: false, message: "Unable to verify code." }, { status: 400 });
  }

  try {
    await recordCommunityUserLogin(user.id, request);
  } catch {
    console.error("[customer-login-metadata] failed", { operation: "login_metadata" });
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
