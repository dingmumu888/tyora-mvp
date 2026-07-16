import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const COOKIE_NAME = "tyora_community_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;
const SESSION_REFRESH_THRESHOLD_SECONDS = 60 * 60 * 24 * 14;

function secret() {
  const value = process.env.COMMUNITY_SESSION_SECRET || process.env.ADMIN_SESSION_SECRET;
  if (!value) throw new Error("Community authentication is not configured.");
  return value;
}

function sign(payload: string) {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

function encode(value: unknown) {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

function decode<T>(value: string): T {
  return JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as T;
}

function safeEqual(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

export type CommunitySession = {
  userId: string;
  email: string;
  name: string;
};

type CommunitySessionPayload = CommunitySession & {
  iat?: number;
  exp?: number;
};

export type ActiveCommunitySession = CommunitySession & {
  expiresAt: number;
};

export function createCommunitySessionToken(session: CommunitySession) {
  const now = Math.floor(Date.now() / 1000);
  const payload = encode({
    ...session,
    iat: now,
    exp: now + SESSION_TTL_SECONDS
  });
  return `${payload}.${sign(payload)}`;
}

export function readCommunitySessionToken(token?: string): ActiveCommunitySession | null {
  if (!token || !token.includes(".")) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature || !safeEqual(signature, sign(payload))) return null;

  try {
    const session = decode<CommunitySessionPayload>(payload);
    if (!session.exp || session.exp <= Math.floor(Date.now() / 1000)) return null;
    return {
      userId: session.userId,
      email: session.email,
      name: session.name,
      expiresAt: session.exp
    };
  } catch {
    return null;
  }
}

export async function getCommunitySession() {
  const cookieStore = await cookies();
  return readCommunitySessionToken(cookieStore.get(COOKIE_NAME)?.value);
}

export async function requireCommunitySession() {
  const session = await getCommunitySession();
  if (session) return session;
  return null;
}

export function setCommunitySessionCookie(response: NextResponse, session: CommunitySession) {
  response.cookies.set({
    name: COOKIE_NAME,
    value: createCommunitySessionToken(session),
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS
  });
  return response;
}

export function shouldRefreshCommunitySession(session: ActiveCommunitySession) {
  const now = Math.floor(Date.now() / 1000);
  return session.expiresAt - now <= SESSION_REFRESH_THRESHOLD_SECONDS;
}

export function refreshCommunitySessionCookieIfNeeded(response: NextResponse, session: ActiveCommunitySession) {
  if (shouldRefreshCommunitySession(session)) {
    return setCommunitySessionCookie(response, session);
  }
  return response;
}

export function clearCommunitySessionCookie(response: NextResponse) {
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
