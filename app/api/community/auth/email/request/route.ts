import { NextResponse } from "next/server";
import { requestEmailLoginCode } from "@/lib/server/email-login";

export async function POST(request: Request) {
  try {
    const body = await request.json() as { email?: string };
    await requestEmailLoginCode(body.email);
  } catch {
    return NextResponse.json({ success: false, message: "Email login is temporarily unavailable." }, { status: 503 });
  }

  return NextResponse.json({
    success: true,
    message: "If the email can receive TYORA login codes, a code has been sent."
  });
}
