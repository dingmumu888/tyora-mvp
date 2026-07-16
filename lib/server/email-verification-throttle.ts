import { createHmac } from "node:crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/server/db";
import { requestIpAddress } from "@/lib/server/traffic-context";
import {
  isVerificationEmail,
  isVerificationLocked,
  nextVerificationFailure,
  verificationThrottleConfig
} from "@/lib/server/email-verification-policy";

type ThrottleScope = "email" | "ip";
type ThrottleKey = { id: string; scope: ThrottleScope; failureLimit: number };

function throttleSecret() {
  const value = process.env.EMAIL_LOGIN_SECRET || process.env.COMMUNITY_SESSION_SECRET || process.env.ADMIN_SESSION_SECRET;
  if (!value) throw new Error("Email verification throttling is not configured.");
  return value;
}

function privateDigest(scope: ThrottleScope, value: string) {
  return createHmac("sha256", throttleSecret())
    .update(`${scope}:${value}`)
    .digest("hex");
}

export function verificationThrottleKeys(email: string, request: Request): ThrottleKey[] {
  const config = verificationThrottleConfig();
  const ip = requestIpAddress(request.headers) || "unknown";
  const keys: ThrottleKey[] = [
    { id: `ip:${privateDigest("ip", ip)}`, scope: "ip", failureLimit: config.ipFailureLimit }
  ];
  if (isVerificationEmail(email)) {
    keys.push({
      id: `email:${privateDigest("email", email)}`,
      scope: "email",
      failureLimit: config.emailFailureLimit
    });
  }
  return keys;
}

export async function isVerificationAttemptAllowed(email: string, request: Request) {
  const keys = verificationThrottleKeys(email, request);
  const rows = await prisma.emailVerificationThrottle.findMany({
    where: { id: { in: keys.map((key) => key.id) } }
  });
  const now = new Date();
  return !rows.some((row) => isVerificationLocked(row, now));
}

async function recordFailureWithClient(
  tx: Prisma.TransactionClient,
  key: ThrottleKey,
  now: Date
) {
  const config = verificationThrottleConfig();
  const existing = await tx.emailVerificationThrottle.findUnique({ where: { id: key.id } });
  const next = nextVerificationFailure(existing, key.failureLimit, config, now);
  await tx.emailVerificationThrottle.upsert({
    where: { id: key.id },
    create: {
      id: key.id,
      scope: key.scope,
      ...next
    },
    update: next
  });
}

export async function recordVerificationFailure(email: string, request: Request) {
  const keys = verificationThrottleKeys(email, request);
  const now = new Date();
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      await prisma.$transaction(async (tx) => {
        for (const key of keys) await recordFailureWithClient(tx, key, now);
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
      return;
    } catch (error) {
      const code = error && typeof error === "object" && "code" in error
        ? String(error.code)
        : "";
      if (code !== "P2034" || attempt === 2) throw error;
    }
  }
}

export async function clearVerificationFailures(email: string, request: Request) {
  const keys = verificationThrottleKeys(email, request);
  await prisma.emailVerificationThrottle.deleteMany({
    where: { id: { in: keys.map((key) => key.id) } }
  });
}
