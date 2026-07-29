ALTER TABLE "CommunityUser"
  ADD COLUMN "expertRole" TEXT,
  ADD COLUMN "expertVerified" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "CommunityIdea"
  ADD COLUMN "postType" TEXT NOT NULL DEFAULT 'Idea Feedback',
  ADD COLUMN "productStage" TEXT NOT NULL DEFAULT 'Concept';

ALTER TABLE "CommunityIdea"
  ADD CONSTRAINT "CommunityIdea_post_type_check"
    CHECK ("postType" IN (
      'Idea Feedback',
      'Design Feedback',
      'Manufacturing Advice',
      'Cost & MOQ',
      'Progress Update'
    )),
  ADD CONSTRAINT "CommunityIdea_product_stage_check"
    CHECK ("productStage" IN (
      'Concept',
      'Design',
      'Prototype',
      'Pre-production',
      'Production'
    ));

CREATE INDEX "CommunityUser_expertVerified_idx"
  ON "CommunityUser"("expertVerified");

CREATE INDEX "CommunityIdea_postType_idx"
  ON "CommunityIdea"("postType");

CREATE INDEX "CommunityIdea_productStage_idx"
  ON "CommunityIdea"("productStage");
