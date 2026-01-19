-- AlterTable
ALTER TABLE "public"."PricingTierWhyItem" ADD COLUMN     "assumptions" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "costBreakdown" JSONB,
ADD COLUMN     "estimatedTimelineWeeks" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
ADD COLUMN     "exampleScope" TEXT,
ADD COLUMN     "exclusions" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "paymentMilestones" JSONB,
ADD COLUMN     "recommendedBudgetGuidance" JSONB,
ADD COLUMN     "typicalDeliverables" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "typicalTeam" JSONB;

-- CreateIndex
CREATE INDEX "PricingTierWhyItem_tierId_idx" ON "public"."PricingTierWhyItem"("tierId");
