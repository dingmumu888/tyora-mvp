ALTER TABLE "SourceRequest"
  ADD COLUMN "publicShowcaseConsent" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "publicShowcasePublished" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "publicShowcaseTitle" TEXT,
  ADD COLUMN "publicShowcaseSummary" TEXT,
  ADD COLUMN "publicShowcaseCountry" TEXT,
  ADD COLUMN "publicShowcaseQuantity" TEXT,
  ADD COLUMN "publicShowcaseImageIndex" INTEGER,
  ADD COLUMN "publicSupplierCount" INTEGER,
  ADD COLUMN "publicQuoteCount" INTEGER,
  ADD COLUMN "publicShowcasePublishedAt" TIMESTAMP(3);

ALTER TABLE "SourceRequest"
  ADD CONSTRAINT "SourceRequest_publicShowcaseImageIndex_check"
    CHECK ("publicShowcaseImageIndex" IS NULL OR "publicShowcaseImageIndex" BETWEEN 0 AND 8),
  ADD CONSTRAINT "SourceRequest_publicSupplierCount_check"
    CHECK ("publicSupplierCount" IS NULL OR "publicSupplierCount" >= 0),
  ADD CONSTRAINT "SourceRequest_publicQuoteCount_check"
    CHECK ("publicQuoteCount" IS NULL OR "publicQuoteCount" >= 0),
  ADD CONSTRAINT "SourceRequest_publicShowcaseConsent_check"
    CHECK (NOT "publicShowcasePublished" OR "publicShowcaseConsent");

CREATE INDEX "SourceRequest_publicShowcasePublished_publicShowcasePublishedAt_idx"
  ON "SourceRequest"("publicShowcasePublished", "publicShowcasePublishedAt");
