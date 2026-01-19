/*
  Warnings:

  - You are about to drop the column `assumptions` on the `PricingTierWhyItem` table. All the data in the column will be lost.
  - You are about to drop the column `costBreakdown` on the `PricingTierWhyItem` table. All the data in the column will be lost.
  - You are about to drop the column `estimatedTimelineWeeks` on the `PricingTierWhyItem` table. All the data in the column will be lost.
  - You are about to drop the column `exampleScope` on the `PricingTierWhyItem` table. All the data in the column will be lost.
  - You are about to drop the column `exclusions` on the `PricingTierWhyItem` table. All the data in the column will be lost.
  - You are about to drop the column `paymentMilestones` on the `PricingTierWhyItem` table. All the data in the column will be lost.
  - You are about to drop the column `recommendedBudgetGuidance` on the `PricingTierWhyItem` table. All the data in the column will be lost.
  - You are about to drop the column `typicalDeliverables` on the `PricingTierWhyItem` table. All the data in the column will be lost.
  - You are about to drop the column `typicalTeam` on the `PricingTierWhyItem` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."PricingTier" ADD COLUMN     "assumptions" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "costBreakdown" JSONB,
ADD COLUMN     "estimatedTimelineWeeks" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
ADD COLUMN     "exampleScope" TEXT,
ADD COLUMN     "exclusions" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "paymentMilestones" JSONB,
ADD COLUMN     "recommendedBudgetGuidance" JSONB,
ADD COLUMN     "typicalDeliverables" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "typicalTeam" JSONB;

-- AlterTable
ALTER TABLE "public"."PricingTierWhyItem" DROP COLUMN "assumptions",
DROP COLUMN "costBreakdown",
DROP COLUMN "estimatedTimelineWeeks",
DROP COLUMN "exampleScope",
DROP COLUMN "exclusions",
DROP COLUMN "paymentMilestones",
DROP COLUMN "recommendedBudgetGuidance",
DROP COLUMN "typicalDeliverables",
DROP COLUMN "typicalTeam";
