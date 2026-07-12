ALTER TABLE "AnalyticsEvent"
  ADD COLUMN IF NOT EXISTS "utmSource" TEXT,
  ADD COLUMN IF NOT EXISTS "utmMedium" TEXT,
  ADD COLUMN IF NOT EXISTS "utmCampaign" TEXT,
  ADD COLUMN IF NOT EXISTS "cityName" TEXT,
  ADD COLUMN IF NOT EXISTS "ipHash" TEXT,
  ADD COLUMN IF NOT EXISTS "maskedIp" TEXT;

CREATE INDEX IF NOT EXISTS "AnalyticsEvent_utmSource_idx" ON "AnalyticsEvent"("utmSource");
CREATE INDEX IF NOT EXISTS "AnalyticsEvent_ipHash_idx" ON "AnalyticsEvent"("ipHash");

ALTER TABLE "CommunityUser"
  ADD COLUMN IF NOT EXISTS "lastLoginAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "loginCount" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "firstTrafficSource" TEXT,
  ADD COLUMN IF NOT EXISTS "lastCountry" TEXT,
  ADD COLUMN IF NOT EXISTS "lastCity" TEXT,
  ADD COLUMN IF NOT EXISTS "lastIpHash" TEXT,
  ADD COLUMN IF NOT EXISTS "lastMaskedIp" TEXT;

CREATE INDEX IF NOT EXISTS "CommunityUser_lastLoginAt_idx" ON "CommunityUser"("lastLoginAt");
CREATE INDEX IF NOT EXISTS "CommunityUser_firstTrafficSource_idx" ON "CommunityUser"("firstTrafficSource");
