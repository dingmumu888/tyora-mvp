import { createHmac } from "node:crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/server/db";
import { getContent } from "@/lib/server/data-store";
import { requestIpAddress } from "@/lib/server/traffic-context";
import {
  actionLimit,
  assertCommunityActionAllowed,
  CommunityActionLimits,
  CommunityActionPolicyError,
  CommunityActionType,
  nextCommunityThrottle,
  normalizeIdempotencyKey
} from "@/lib/server/community-action-policy";

const RECEIPT_TTL_MS = 24 * 60 * 60 * 1000;

function actionSecret() {
  const value = process.env.COMMUNITY_SESSION_SECRET || process.env.ADMIN_SESSION_SECRET;
  if (!value) throw new Error("Community action protection is not configured.");
  return value;
}

function privateDigest(scope: string, value: string) {
  return createHmac("sha256", actionSecret()).update(`${scope}:${value}`).digest("hex");
}

async function configuredLimits(): Promise<CommunityActionLimits> {
  const content = await getContent();
  return {
    comment: content.communityPage.commentRateLimit,
    reaction: content.communityPage.reactionRateLimit,
    "comment-reaction": content.communityPage.reactionRateLimit,
    share: content.communityPage.shareRateLimit,
    windowMinutes: content.communityPage.rateWindowMinutes
  };
}

function parseResult<T>(value: string): T {
  return JSON.parse(value) as T;
}

export async function executeGuardedCommunityAction<T>(input: {
  request: Request;
  userId: string;
  action: CommunityActionType;
  resourceId: string;
  execute: (tx: Prisma.TransactionClient) => Promise<T>;
}) {
  const idempotencyKey = normalizeIdempotencyKey(input.request.headers.get("idempotency-key"));
  const ipAddress = requestIpAddress(input.request.headers) || "unknown";
  const receiptId = privateDigest("receipt", `${input.userId}:${input.action}:${input.resourceId}:${idempotencyKey}`);
  const limits = await configuredLimits();
  const limit = actionLimit(input.action, limits);
  const throttleKeys = [
    { id: privateDigest("user", `${input.action}:${input.userId}`), scope: `user:${input.action}` },
    { id: privateDigest("ip", `${input.action}:${ipAddress}`), scope: `ip:${input.action}` }
  ];

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await prisma.$transaction(async (tx) => {
        const now = new Date();
        const existingReceipt = await tx.communityActionReceipt.findUnique({ where: { id: receiptId } });
        if (existingReceipt && existingReceipt.expiresAt.getTime() > now.getTime()) {
          if (
            existingReceipt.userId !== input.userId ||
            existingReceipt.action !== input.action ||
            existingReceipt.resourceId !== input.resourceId
          ) {
            throw new CommunityActionPolicyError("The action could not be processed.", 409);
          }
          return { data: parseResult<T>(existingReceipt.resultJson), replayed: true };
        }

        for (const key of throttleKeys) {
          const existing = await tx.communityActionThrottle.findUnique({ where: { id: key.id } });
          assertCommunityActionAllowed(existing, limit, now);
          const next = nextCommunityThrottle(existing, limits.windowMinutes, now);
          await tx.communityActionThrottle.upsert({
            where: { id: key.id },
            create: { id: key.id, scope: key.scope, ...next },
            update: next
          });
        }

        const data = await input.execute(tx);
        await tx.communityActionReceipt.upsert({
          where: { id: receiptId },
          create: {
            id: receiptId,
            userId: input.userId,
            action: input.action,
            resourceId: input.resourceId,
            resultJson: JSON.stringify(data),
            expiresAt: new Date(now.getTime() + RECEIPT_TTL_MS)
          },
          update: {
            resultJson: JSON.stringify(data),
            expiresAt: new Date(now.getTime() + RECEIPT_TTL_MS)
          }
        });
        return { data, replayed: false };
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    } catch (error) {
      const code = error && typeof error === "object" && "code" in error ? String(error.code) : "";
      if (code !== "P2034" || attempt === 2) throw error;
    }
  }
  throw new CommunityActionPolicyError("The action could not be processed.", 409);
}
