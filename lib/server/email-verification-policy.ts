export type VerificationThrottleConfig = {
  emailFailureLimit: number;
  ipFailureLimit: number;
  windowSeconds: number;
  lockoutSeconds: number;
};

export type VerificationThrottleState = {
  failureCount: number;
  windowStartedAt: Date;
  lockedUntil: Date | null;
  expiresAt: Date;
};

function boundedInteger(
  value: string | undefined,
  fallback: number,
  minimum: number,
  maximum: number
) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= minimum && parsed <= maximum
    ? parsed
    : fallback;
}

export function verificationThrottleConfig(
  environment: Record<string, string | undefined> = process.env
): VerificationThrottleConfig {
  return {
    emailFailureLimit: boundedInteger(environment.EMAIL_VERIFY_EMAIL_FAILURE_LIMIT, 5, 3, 50),
    ipFailureLimit: boundedInteger(environment.EMAIL_VERIFY_IP_FAILURE_LIMIT, 20, 5, 200),
    windowSeconds: boundedInteger(environment.EMAIL_VERIFY_FAILURE_WINDOW_SECONDS, 900, 60, 86400),
    lockoutSeconds: boundedInteger(environment.EMAIL_VERIFY_LOCKOUT_SECONDS, 900, 60, 86400)
  };
}

export function normalizeVerificationEmail(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase().slice(0, 254) : "";
}

export function isVerificationEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function isVerificationLocked(
  state: VerificationThrottleState | null | undefined,
  now = new Date()
) {
  if (!state || state.expiresAt.getTime() <= now.getTime()) return false;
  return Boolean(state.lockedUntil && state.lockedUntil.getTime() > now.getTime());
}

export function nextVerificationFailure(
  state: VerificationThrottleState | null | undefined,
  failureLimit: number,
  config: Pick<VerificationThrottleConfig, "windowSeconds" | "lockoutSeconds">,
  now = new Date()
): VerificationThrottleState {
  const windowMs = config.windowSeconds * 1000;
  const lockoutMs = config.lockoutSeconds * 1000;
  const expired = !state || state.expiresAt.getTime() <= now.getTime();
  const outsideWindow = Boolean(
    state && state.windowStartedAt.getTime() + windowMs <= now.getTime()
  );
  const failureCount = expired || outsideWindow ? 1 : state.failureCount + 1;
  const windowStartedAt = expired || outsideWindow ? now : state.windowStartedAt;
  const lockedUntil = failureCount >= failureLimit
    ? new Date(now.getTime() + lockoutMs)
    : null;
  const windowExpiresAt = new Date(windowStartedAt.getTime() + windowMs);
  const expiresAt = lockedUntil && lockedUntil > windowExpiresAt
    ? lockedUntil
    : windowExpiresAt;
  return { failureCount, windowStartedAt, lockedUntil, expiresAt };
}
