ALTER TABLE "CommunityIdea"
  ADD COLUMN IF NOT EXISTS "moderationStatus" TEXT NOT NULL DEFAULT 'Approved';

ALTER TABLE "CommunityIdea"
  ALTER COLUMN "moderationStatus" SET DEFAULT 'Pending';

CREATE INDEX IF NOT EXISTS "CommunityIdea_moderationStatus_idx"
  ON "CommunityIdea"("moderationStatus");

CREATE TABLE IF NOT EXISTS "EmailVerificationThrottle" (
  "id" TEXT NOT NULL,
  "scope" TEXT NOT NULL,
  "failureCount" INTEGER NOT NULL DEFAULT 0,
  "windowStartedAt" TIMESTAMP(3) NOT NULL,
  "lockedUntil" TIMESTAMP(3),
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "EmailVerificationThrottle_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "EmailVerificationThrottle_scope_idx"
  ON "EmailVerificationThrottle"("scope");

CREATE INDEX IF NOT EXISTS "EmailVerificationThrottle_lockedUntil_idx"
  ON "EmailVerificationThrottle"("lockedUntil");

CREATE INDEX IF NOT EXISTS "EmailVerificationThrottle_expiresAt_idx"
  ON "EmailVerificationThrottle"("expiresAt");
