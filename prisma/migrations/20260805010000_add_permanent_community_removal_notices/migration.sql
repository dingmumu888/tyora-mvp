CREATE TABLE "CommunityModerationNotice" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "ideaId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "reason" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "CommunityModerationNotice_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CommunityModerationNotice_userId_createdAt_idx"
  ON "CommunityModerationNotice"("userId", "createdAt");

CREATE INDEX "CommunityModerationNotice_ideaId_idx"
  ON "CommunityModerationNotice"("ideaId");

CREATE INDEX "CommunityModerationNotice_createdAt_idx"
  ON "CommunityModerationNotice"("createdAt");

ALTER TABLE "CommunityModerationNotice"
  ADD CONSTRAINT "CommunityModerationNotice_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "CommunityUser"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
