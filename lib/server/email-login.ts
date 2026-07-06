import { createHash, randomInt, timingSafeEqual } from "node:crypto";
import { makeCommunityId, usernameFromEmail } from "@/lib/community";
import { prisma } from "@/lib/server/db";

const CODE_TTL_MINUTES = 10;
const REQUEST_WINDOW_MINUTES = 10;
const MAX_REQUESTS_PER_WINDOW = 3;
const FALLBACK_FROM = "onboarding@resend.dev";
const DEFAULT_FROM = "TYORA <login@tyora.io>";

function normalizeEmail(value: unknown) {
  if (typeof value !== "string") return "";
  return value.trim().toLowerCase().slice(0, 254);
}

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
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
  return process.env.RESEND_FROM || DEFAULT_FROM;
}

function shouldUseTestSender() {
  return sender().includes("login@tyora.io") && process.env.RESEND_USE_TEST_SENDER !== "false";
}

async function sendLoginEmail(email: string, code: string) {
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

  if (!response.ok) throw new Error("Unable to send login code.");
}

export async function requestEmailLoginCode(input: unknown) {
  const email = normalizeEmail(input);
  if (!isEmail(email)) return;

  const since = new Date(Date.now() - REQUEST_WINDOW_MINUTES * 60 * 1000);
  const recent = await prisma.emailLoginCode.count({
    where: {
      email,
      createdAt: { gte: since }
    }
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
  await sendLoginEmail(email, code);
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
