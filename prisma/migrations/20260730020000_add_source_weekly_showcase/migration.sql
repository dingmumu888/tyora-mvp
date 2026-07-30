CREATE TABLE "SourceWeeklyProduct" (
  "id" TEXT NOT NULL,
  "productCode" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "titleZh" TEXT,
  "summary" TEXT,
  "summaryZh" TEXT,
  "factoryPrice" TEXT,
  "moq" TEXT,
  "imageUrl" TEXT NOT NULL,
  "imageObjectPath" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'DRAFT',
  "publishedAt" TIMESTAMP(3),
  "expiresAt" TIMESTAMP(3),
  "purgeAt" TIMESTAMP(3),
  "interestCount" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SourceWeeklyProduct_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SourceWeeklyInterest" (
  "id" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "visitorHash" TEXT NOT NULL,
  "dayBucket" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SourceWeeklyInterest_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SourceWeeklyArchive" (
  "id" TEXT NOT NULL,
  "productCode" TEXT NOT NULL,
  "publishedAt" TIMESTAMP(3),
  "expiredAt" TIMESTAMP(3),
  "interestCount" INTEGER NOT NULL DEFAULT 0,
  "purgedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SourceWeeklyArchive_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SourceWeeklyProduct_productCode_key" ON "SourceWeeklyProduct"("productCode");
CREATE INDEX "SourceWeeklyProduct_status_publishedAt_expiresAt_idx" ON "SourceWeeklyProduct"("status", "publishedAt", "expiresAt");
CREATE INDEX "SourceWeeklyProduct_purgeAt_idx" ON "SourceWeeklyProduct"("purgeAt");
CREATE INDEX "SourceWeeklyProduct_createdAt_idx" ON "SourceWeeklyProduct"("createdAt");

CREATE UNIQUE INDEX "SourceWeeklyInterest_productId_visitorHash_dayBucket_key" ON "SourceWeeklyInterest"("productId", "visitorHash", "dayBucket");
CREATE INDEX "SourceWeeklyInterest_productId_createdAt_idx" ON "SourceWeeklyInterest"("productId", "createdAt");
CREATE INDEX "SourceWeeklyInterest_createdAt_idx" ON "SourceWeeklyInterest"("createdAt");

CREATE UNIQUE INDEX "SourceWeeklyArchive_productCode_key" ON "SourceWeeklyArchive"("productCode");
CREATE INDEX "SourceWeeklyArchive_purgedAt_idx" ON "SourceWeeklyArchive"("purgedAt");

ALTER TABLE "SourceWeeklyInterest"
  ADD CONSTRAINT "SourceWeeklyInterest_productId_fkey"
  FOREIGN KEY ("productId") REFERENCES "SourceWeeklyProduct"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
