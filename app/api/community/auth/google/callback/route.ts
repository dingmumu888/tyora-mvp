import { NextResponse } from "next/server";
import { setCommunitySessionCookie } from "@/lib/server/community-auth";
import { upsertCommunityUser } from "@/lib/server/community-store";
import { authUrl } from "@/lib/server/auth-url";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!code || !clientId || !clientSecret) {
    return NextResponse.redirect(new URL("/ask?login=unavailable", request.url));
  }

  const redirectUri = authUrl("/api/community/auth/google/callback", request);
  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code"
    })
  });

  if (!tokenResponse.ok) {
    return NextResponse.redirect(new URL("/ask?login=failed", request.url));
  }

  const token = await tokenResponse.json() as { access_token?: string };
  const profileResponse = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { authorization: `Bearer ${token.access_token}` }
  });
  if (!profileResponse.ok) {
    return NextResponse.redirect(new URL("/ask?login=failed", request.url));
  }

  const profile = await profileResponse.json() as {
    sub: string;
    email: string;
    name?: string;
    picture?: string;
  };
  const user = await upsertCommunityUser({
    googleId: profile.sub,
    email: profile.email,
    name: profile.name || profile.email,
    avatar: profile.picture
  });

  return setCommunitySessionCookie(
    NextResponse.redirect(new URL("/ask", request.url)),
    { userId: user.id, email: user.email, name: user.name }
  );
}
