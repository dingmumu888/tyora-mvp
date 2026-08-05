CREATE TABLE "CommunityPrivateFollowUp" (
  "id" TEXT NOT NULL,
  "ideaId" TEXT NOT NULL,
  "authorId" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "CommunityPrivateFollowUp_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CommunityPrivateFollowUp_ideaId_createdAt_idx"
  ON "CommunityPrivateFollowUp"("ideaId", "createdAt");

CREATE INDEX "CommunityPrivateFollowUp_authorId_createdAt_idx"
  ON "CommunityPrivateFollowUp"("authorId", "createdAt");

CREATE INDEX "CommunityPrivateFollowUp_createdAt_idx"
  ON "CommunityPrivateFollowUp"("createdAt");

ALTER TABLE "CommunityPrivateFollowUp"
  ADD CONSTRAINT "CommunityPrivateFollowUp_ideaId_fkey"
  FOREIGN KEY ("ideaId") REFERENCES "CommunityIdea"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CommunityPrivateFollowUp"
  ADD CONSTRAINT "CommunityPrivateFollowUp_authorId_fkey"
  FOREIGN KEY ("authorId") REFERENCES "CommunityUser"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
