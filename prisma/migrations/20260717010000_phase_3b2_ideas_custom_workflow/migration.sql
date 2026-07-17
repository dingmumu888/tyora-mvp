ALTER TABLE "CommunityIdea"
  ADD COLUMN "publicConsentAt" TIMESTAMP(3),
  ADD COLUMN "moderatedAt" TIMESTAMP(3),
  ADD COLUMN "moderationNote" TEXT;

ALTER TABLE "TyoraReview"
  ADD COLUMN "moldRequirement" TEXT,
  ADD COLUMN "assumptions" TEXT,
  ADD COLUMN "confidence" TEXT,
  ADD COLUMN "assessmentStatus" TEXT NOT NULL DEFAULT 'Published',
  ADD COLUMN "disclaimer" TEXT NOT NULL DEFAULT 'Preliminary estimate only. Final pricing, MOQ, and production feasibility depend on confirmed specifications, samples, and factory quotations.',
  ADD COLUMN "mainRisks" TEXT,
  ADD COLUMN "recommendedNextStep" TEXT,
  ADD COLUMN "customEligible" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "publishedAt" TIMESTAMP(3);

ALTER TABLE "TyoraReview"
  ALTER COLUMN "assessmentStatus" SET DEFAULT 'Draft';

CREATE TABLE "CustomInquiry" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "ideaId" TEXT,
  "productName" TEXT NOT NULL,
  "productDescription" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "quantity" TEXT NOT NULL,
  "budget" TEXT NOT NULL,
  "targetMarket" TEXT NOT NULL,
  "timeline" TEXT NOT NULL,
  "contactEmail" TEXT,
  "contactWhatsapp" TEXT,
  "privateFilesJson" TEXT NOT NULL DEFAULT '[]',
  "ideaSnapshotJson" TEXT NOT NULL DEFAULT '{}',
  "assessmentSnapshotJson" TEXT NOT NULL DEFAULT '{}',
  "status" TEXT NOT NULL DEFAULT 'Submitted',
  "nextStep" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "CustomInquiry_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "CustomInquiry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "CommunityUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "CustomInquiry_ideaId_fkey" FOREIGN KEY ("ideaId") REFERENCES "CommunityIdea"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "CustomInquiry_userId_idx" ON "CustomInquiry"("userId");
CREATE INDEX "CustomInquiry_ideaId_idx" ON "CustomInquiry"("ideaId");
CREATE INDEX "CustomInquiry_status_idx" ON "CustomInquiry"("status");
CREATE INDEX "CustomInquiry_createdAt_idx" ON "CustomInquiry"("createdAt");

CREATE TABLE "CommunityShare" (
  "id" TEXT NOT NULL,
  "channel" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "ideaId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "CommunityShare_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "CommunityShare_userId_fkey" FOREIGN KEY ("userId") REFERENCES "CommunityUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "CommunityShare_ideaId_fkey" FOREIGN KEY ("ideaId") REFERENCES "CommunityIdea"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "CommunityShare_userId_ideaId_channel_key" ON "CommunityShare"("userId", "ideaId", "channel");
CREATE INDEX "CommunityShare_ideaId_idx" ON "CommunityShare"("ideaId");
CREATE INDEX "CommunityShare_createdAt_idx" ON "CommunityShare"("createdAt");

CREATE TABLE "CommunityActionThrottle" (
  "id" TEXT NOT NULL,
  "scope" TEXT NOT NULL,
  "count" INTEGER NOT NULL DEFAULT 0,
  "windowStartedAt" TIMESTAMP(3) NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "CommunityActionThrottle_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CommunityActionThrottle_scope_idx" ON "CommunityActionThrottle"("scope");
CREATE INDEX "CommunityActionThrottle_expiresAt_idx" ON "CommunityActionThrottle"("expiresAt");

CREATE TABLE "CommunityActionReceipt" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "resourceId" TEXT NOT NULL,
  "resultJson" TEXT NOT NULL DEFAULT '{}',
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "CommunityActionReceipt_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CommunityActionReceipt_userId_idx" ON "CommunityActionReceipt"("userId");
CREATE INDEX "CommunityActionReceipt_resourceId_idx" ON "CommunityActionReceipt"("resourceId");
CREATE INDEX "CommunityActionReceipt_expiresAt_idx" ON "CommunityActionReceipt"("expiresAt");
