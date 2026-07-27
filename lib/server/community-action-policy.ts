export const communityActionTypes = ["comment", "reaction", "comment-reaction", "share"] as const;

export type CommunityActionType = (typeof communityActionTypes)[number];

export type CommunityActionLimits = {
  comment: number;
  reaction: number;
  "comment-reaction": number;
  share: number;
  windowMinutes: number;
};

export type CommunityThrottleState = {
  count: number;
  windowStartedAt: Date;
  expiresAt: Date;
};

export class CommunityActionPolicyError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "CommunityActionPolicyError";
    this.status = status;
  }
}

export function normalizeIdempotencyKey(value: unknown) {
  if (typeof value !== "string") {
    throw new CommunityActionPolicyError("A valid Idempotency-Key header is required.", 400);
  }
  const normalized = value.trim();
  if (normalized.length < 16 || normalized.length > 160 || !/^[a-zA-Z0-9._:-]+$/.test(normalized)) {
    throw new CommunityActionPolicyError("A valid Idempotency-Key header is required.", 400);
  }
  return normalized;
}

export function actionLimit(action: CommunityActionType, limits: CommunityActionLimits) {
  if (action === "comment") return limits.comment;
  if (action === "share") return limits.share;
  return limits.reaction;
}

export function nextCommunityThrottle(
  existing: CommunityThrottleState | null | undefined,
  windowMinutes: number,
  now = new Date()
) {
  const windowMs = Math.max(1, Math.floor(windowMinutes)) * 60 * 1000;
  if (!existing || existing.expiresAt.getTime() <= now.getTime()) {
    return {
      count: 1,
      windowStartedAt: now,
      expiresAt: new Date(now.getTime() + windowMs)
    };
  }
  return {
    count: existing.count + 1,
    windowStartedAt: existing.windowStartedAt,
    expiresAt: existing.expiresAt
  };
}

export function assertCommunityActionAllowed(
  existing: CommunityThrottleState | null | undefined,
  limit: number,
  now = new Date()
) {
  if (existing && existing.expiresAt.getTime() > now.getTime() && existing.count >= limit) {
    throw new CommunityActionPolicyError("Too many actions. Try again later.", 429);
  }
}
