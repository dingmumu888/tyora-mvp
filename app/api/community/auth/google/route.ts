import { NextResponse } from "next/server";
import { authUrl } from "@/lib/server/auth-url";

export async function GET(request: Request) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json({ error: "Google Login is not configured." }, { status: 500 });
  }

  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", authUrl("/api/community/auth/google/callback", request));
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid email profile");
  url.searchParams.set("prompt", "select_account");
  return NextResponse.redirect(url);
}
