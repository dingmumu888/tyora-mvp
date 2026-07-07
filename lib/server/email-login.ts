import { createHash, randomInt, timingSafeEqual } from "node:crypto";
import { makeCommunityId, usernameFromEmail } from "@/lib/community";
import { prisma } from "@/lib/server/db";

const CODE_TTL_MINUTES = 10;
const REQUEST_WINDOW_MINUTES = 10;
const MAX_REQUESTS_PER_WINDOW = 3;
const FALLBACK_FROM = "onboarding@resend.dev";
const DEFAULT_FROM = "TYORA <login@tyora.io>";
export type EmailLoginStage =
  | "normalize_email"
  | "validate_email"
  | "rate_limit_check"
  | "create_login_code"
  | "before_resend_fetch"
  | "after_resend_fetch";

type EmailLoginTrace = (stage: EmailLoginStage, data?: Record<string, unknown>) => void;

export class ResendEmailError extends Error {
  status: number;
  statusText: string;
  responseHeaders: Record<string, string>;
  responseBody: string;
  errorCode: string | null;

  constructor(status: number, statusText: string, responseHeaders: Record<string, string>, responseBody: string) {
    const errorCode = parseResendErrorCode(responseBody);
    super(`Unable to send login code. Resend status=${status} ${statusText}; code=${errorCode || "unknown"}; response=${responseBody}`);
    this.name = "ResendEmailError";
    this.status = status;
    this.statusText = statusText;
    this.responseHeaders = responseHeaders;
    this.responseBody = responseBody;
    this.errorCode = errorCode;
  }
}

function normalizeEmail(value: unknown) {
  if (typeof value !== "string") return "";
  return value.trim().toLowerCase().slice(0, 254);
}

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function safeParseJson(value: string) {
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return null;
  }
}

function parseResendErrorCode(responseBody: string) {
  const payload = safeParseJson(responseBody) as { error?: { code?: unknown }; code?: unknown } | null;
  const code = payload?.error?.code ?? payload?.code;
  return typeof code === "string" ? code : null;
}

function responseHeaders(response: Response) {
  const headers: Record<string, string> = {};
  response.headers.forEach((value, key) => {
    headers[key] = value;
  });
  return headers;
}

function authSecret() {
  return process.env.EMAIL_LOGIN_SECRET || process.env.COMMUNITY_SESSION_SECRET || process.env.ADMIN_SESSION_SECRET || "tyora-email-login-dev";
}

function hashCode(email: string, code: string) {
  return createHash("sha256").update(`${authSecret()}:${email}:${code}`).digest("hex");
}

function safeEqual(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

function sender() {
  const configured = process.env.RESEND_FROM || DEFAULT_FROM;
  const isProduction = process.env.VERCEL_ENV === "production" || process.env.NODE_ENV === "production";
  if (isProduction && configured.includes("onboarding@resend.dev")) return DEFAULT_FROM;
  return configured;
}

function shouldUseTestSender() {
  const isProduction = process.env.VERCEL_ENV === "production" || process.env.NODE_ENV === "production";
  return !isProduction && sender().includes("login@tyora.io") && process.env.RESEND_USE_TEST_SENDER === "true";
}

export function getEmailLoginDebugContext() {
  return {
    hasResendApiKey: Boolean(process.env.RESEND_API_KEY),
    hasAuthOrigin: Boolean(process.env.AUTH_ORIGIN),
    authOrigin: process.env.AUTH_ORIGIN || null,
    configuredSender: sender(),
    environment: process.env.VERCEL_ENV || process.env.NODE_ENV || null,
    resendUseTestSender: process.env.RESEND_USE_TEST_SENDER || null,
    shouldUseTestSender: shouldUseTestSender(),
    actualSender: shouldUseTestSender() ? FALLBACK_FROM : sender()
  };
}

async function sendLoginEmail(email: string, code: string, trace?: EmailLoginTrace) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("Email login is not configured.");

  const from = shouldUseTestSender() ? FALLBACK_FROM : sender();
  const text = [
    "Your TYORA login code is:",
    "",
    code,
    "",
    "This code expires in 10 minutes.",
    "",
    "If you did not request this, you can ignore this email."
  ].join("\n");

  trace?.("before_resend_fetch", {
    email,
    from,
    hasResendApiKey: Boolean(apiKey)
  });
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json"
    },
    body: JSON.stringify({
      from,
      to: email,
      subject: "Your TYORA login code",
      text
    })
  });
  const responseText = await response.text().catch((error) => `Unable to read Resend response body: ${error instanceof Error ? error.message : String(error)}`);
  const headers = responseHeaders(response);
  trace?.("after_resend_fetch", {
    email,
    status: response.status,
    ok: response.ok,
    headers,
    rawResponseBody: responseText
  });

  if (!response.ok) {
    throw new ResendEmailError(response.status, response.statusText, headers, responseText);
  }
}

export async function requestEmailLoginCode(input: unknown, trace?: EmailLoginTrace) {
  const email = normalizeEmail(input);
  trace?.("normalize_email", {
    inputType: typeof input,
    email
  });
  const valid = isEmail(email);
  trace?.("validate_email", {
    email,
    valid
  });
  if (!valid) return;

  const since = new Date(Date.now() - REQUEST_WINDOW_MINUTES * 60 * 1000);
  const recent = await prisma.emailLoginCode.count({
    where: {
      email,
      createdAt: { gte: since }
    }
  });
  trace?.("rate_limit_check", {
    email,
    recent,
    limit: MAX_REQUESTS_PER_WINDOW,
    limited: recent >= MAX_REQUESTS_PER_WINDOW
  });
  if (recent >= MAX_REQUESTS_PER_WINDOW) return;

  const code = randomInt(100000, 1000000).toString();
  await prisma.emailLoginCode.create({
    data: {
      id: makeCommunityId("LOGIN"),
      email,
      codeHash: hashCode(email, code),
      expiresAt: new Date(Date.now() + CODE_TTL_MINUTES * 60 * 1000)
    }
  });
  trace?.("create_login_code", {
    email
  });
  await sendLoginEmail(email, code, trace);
}

export async function verifyEmailLoginCode(emailInput: unknown, codeInput: unknown) {
  const email = normalizeEmail(emailInput);
  const code = typeof codeInput === "string" ? codeInput.trim() : "";
  if (!isEmail(email) || !/^\d{6}$/.test(code)) return null;

  const row = await prisma.emailLoginCode.findFirst({
    where: {
      email,
      usedAt: null,
      expiresAt: { gt: new Date() }
    },
    orderBy: { createdAt: "desc" }
  });
  if (!row || !safeEqual(row.codeHash, hashCode(email, code))) return null;

  await prisma.emailLoginCode.update({
    where: { id: row.id },
    data: { usedAt: new Date() }
  });

  const existing = await prisma.communityUser.findUnique({ where: { email } });
  const username = existing?.username || usernameFromEmail(email);
  const collision = existing ? null : await prisma.communityUser.findUnique({ where: { username } });
  const finalUsername = collision ? `${username}-${Date.now().toString(36)}` : username;
  const name = existing?.name || email.split("@")[0] || "TYORA Creator";

  return prisma.communityUser.upsert({
    where: { email },
    create: {
      id: makeCommunityId("USER"),
      email,
      username: finalUsername,
      name
    },
    update: {
      email,
      name
    }
  });
}
