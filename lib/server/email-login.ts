import { createHash, randomInt, timingSafeEqual } from "node:crypto";
import { renderVerificationEmail } from "@/lib/email";
import { makeCommunityId, usernameFromEmail } from "@/lib/community";
import { prisma } from "@/lib/server/db";
import {
  EmailDeliveryPlan,
  resolveEmailDeliveryPlan
} from "@/lib/server/email-delivery-policy";
import {
  isVerificationEmail,
  normalizeVerificationEmail
} from "@/lib/server/email-verification-policy";
import {
  isVerificationAttemptAllowed,
  recordVerificationFailure,
  verificationThrottleKeys
} from "@/lib/server/email-verification-throttle";

const CODE_TTL_MINUTES = 10;
const REQUEST_WINDOW_MINUTES = 10;
const MAX_REQUESTS_PER_WINDOW = 3;
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
  errorCode: string | null;

  constructor(status: number, responseBody: string) {
    const errorCode = parseResendErrorCode(responseBody);
    super("Unable to send login code through the email provider.");
    this.name = "ResendEmailError";
    this.status = status;
    this.errorCode = errorCode;
  }
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
  return typeof code === "string" && /^[a-z0-9_.-]{1,64}$/i.test(code) ? code : null;
}

function authSecret() {
  const value = process.env.EMAIL_LOGIN_SECRET || process.env.COMMUNITY_SESSION_SECRET || process.env.ADMIN_SESSION_SECRET;
  if (!value) throw new Error("Email login is not configured.");
  return value;
}

function hashCode(email: string, code: string) {
  return createHash("sha256").update(`${authSecret()}:${email}:${code}`).digest("hex");
}

function safeEqual(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

async function sendLoginEmail(plan: EmailDeliveryPlan, code: string, trace?: EmailLoginTrace) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("Email login is not configured.");

  const emailContent = renderVerificationEmail({ code });

  trace?.("before_resend_fetch", {
    deployment: plan.deployment,
    senderKind: plan.sender.includes("resend.dev") ? "test" : "verified"
  });
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json"
    },
    body: JSON.stringify({
      from: plan.sender,
      to: plan.recipient,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text
    })
  });
  const responseText = await response.text().catch(() => "");
  const errorCode = parseResendErrorCode(responseText);
  trace?.("after_resend_fetch", {
    status: response.status,
    ok: response.ok,
    errorCode
  });

  if (!response.ok) {
    throw new ResendEmailError(response.status, responseText);
  }
}

export async function requestEmailLoginCode(input: unknown, trace?: EmailLoginTrace) {
  const email = normalizeVerificationEmail(input);
  trace?.("normalize_email", {
    inputType: typeof input
  });
  const valid = isVerificationEmail(email);
  trace?.("validate_email", {
    valid
  });
  if (!valid) return;

  const deliveryPlan = resolveEmailDeliveryPlan(email, process.env);

  const since = new Date(Date.now() - REQUEST_WINDOW_MINUTES * 60 * 1000);
  const recent = await prisma.emailLoginCode.count({
    where: {
      email,
      createdAt: { gte: since }
    }
  });
  trace?.("rate_limit_check", {
    recent,
    limit: MAX_REQUESTS_PER_WINDOW,
    limited: recent >= MAX_REQUESTS_PER_WINDOW
  });
  if (recent >= MAX_REQUESTS_PER_WINDOW) return;

  const code = randomInt(100000, 1000000).toString();
  const loginCodeId = makeCommunityId("LOGIN");
  await prisma.emailLoginCode.create({
    data: {
      id: loginCodeId,
      email,
      codeHash: hashCode(email, code),
      expiresAt: new Date(Date.now() + CODE_TTL_MINUTES * 60 * 1000)
    }
  });
  trace?.("create_login_code", {
    created: true
  });
  try {
    await sendLoginEmail(deliveryPlan, code, trace);
  } catch (error) {
    await prisma.emailLoginCode.deleteMany({ where: { id: loginCodeId } }).catch(() => undefined);
    throw error;
  }
}

export async function verifyEmailLoginCode(emailInput: unknown, codeInput: unknown, request: Request) {
  const email = normalizeVerificationEmail(emailInput);
  const code = typeof codeInput === "string" ? codeInput.trim() : "";
  if (!(await isVerificationAttemptAllowed(email, request))) return null;
  if (!isVerificationEmail(email) || !/^\d{6}$/.test(code)) {
    await recordVerificationFailure(email, request);
    return null;
  }

  const now = new Date();
  const throttleIds = verificationThrottleKeys(email, request).map((key) => key.id);
  const user = await prisma.$transaction(async (tx) => {
    const row = await tx.emailLoginCode.findFirst({
      where: {
        email,
        usedAt: null,
        expiresAt: { gt: now }
      },
      orderBy: { createdAt: "desc" }
    });
    if (!row || !safeEqual(row.codeHash, hashCode(email, code))) return null;

    const consumed = await tx.emailLoginCode.updateMany({
      where: { id: row.id, usedAt: null, expiresAt: { gt: now } },
      data: { usedAt: now }
    });
    if (consumed.count !== 1) return null;

    const existing = await tx.communityUser.findUnique({ where: { email } });
    const username = existing?.username || usernameFromEmail(email);
    const collision = existing ? null : await tx.communityUser.findUnique({ where: { username } });
    const finalUsername = collision ? `${username}-${Date.now().toString(36)}` : username;
    const name = existing?.name || email.split("@")[0] || "TYORA Creator";
    const verifiedUser = await tx.communityUser.upsert({
      where: { email },
      create: {
        id: makeCommunityId("USER"),
        email,
        username: finalUsername,
        name
      },
      update: { name }
    });
    await tx.emailVerificationThrottle.deleteMany({
      where: { id: { in: throttleIds } }
    });
    return verifiedUser;
  });

  if (!user) await recordVerificationFailure(email, request);
  return user;
}
