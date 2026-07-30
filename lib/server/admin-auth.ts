import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getAdminCredentialVersion } from "@/lib/server/admin-credential-store";

const COOKIE_NAME = "tyora_admin_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

function base64UrlEncode(value: string) {
  return Buffer.from(value).toString("base64url");
}

function base64UrlDecode(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function getSessionSecret() {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) {
    throw new Error("ADMIN_SESSION_SECRET is not configured.");
  }
  return secret;
}

function sign(payload: string, secret: string) {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

function signaturesMatch(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

type AdminSessionPayload = {
  exp: number;
  pv: number;
};

function readAdminSessionToken(token?: string): AdminSessionPayload | null {
  if (!token || !token.includes(".")) return null;

  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;

  const expected = sign(payload, getSessionSecret());
  if (!signaturesMatch(signature, expected)) return null;

  try {
    const session = JSON.parse(base64UrlDecode(payload)) as Partial<AdminSessionPayload>;
    if (
      typeof session.exp !== "number" ||
      session.exp <= Math.floor(Date.now() / 1000) ||
      typeof session.pv !== "number"
    ) {
      return null;
    }
    return session as AdminSessionPayload;
  } catch {
    return null;
  }
}

export function createAdminSessionToken(credentialVersion = 0) {
  const now = Math.floor(Date.now() / 1000);
  const payload = base64UrlEncode(
    JSON.stringify({
      iat: now,
      exp: now + SESSION_TTL_SECONDS,
      pv: credentialVersion
    })
  );
  const signature = sign(payload, getSessionSecret());
  return `${payload}.${signature}`;
}

export function isValidAdminSessionToken(token?: string) {
  return Boolean(readAdminSessionToken(token));
}

export async function hasAdminSession() {
  const cookieStore = await cookies();
  const session = readAdminSessionToken(cookieStore.get(COOKIE_NAME)?.value);
  if (!session) return false;
  return session.pv === await getAdminCredentialVersion();
}

export async function requireAdminSession() {
  try {
    if (await hasAdminSession()) return null;
  } catch {
    return unauthorized();
  }
  return unauthorized();
}

export function setAdminSessionCookie(response: NextResponse, credentialVersion = 0) {
  response.cookies.set({
    name: COOKIE_NAME,
    value: createAdminSessionToken(credentialVersion),
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS
  });
  return response;
}

export function clearAdminSessionCookie(response: NextResponse) {
  response.cookies.set({
    name: COOKIE_NAME,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0
  });
  return response;
}

export function unauthorized() {
  return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
}
