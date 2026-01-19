/*
  Warnings:

  - You are about to drop the column `features` on the `PricingPage` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."PricingPage" DROP COLUMN "features";

-- CreateTable
CREATE TABLE "public"."PricingTier" (
    "id" SERIAL NOT NULL,
    "pageId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "tagline" TEXT,
    "taglineParts" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "rangeUsd" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "bullets" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "highlight" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "PricingTier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."QuickEstimate" (
    "id" SERIAL NOT NULL,
    "pageId" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "low" INTEGER NOT NULL,
    "high" INTEGER NOT NULL,
    "note" TEXT,

    CONSTRAINT "QuickEstimate_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."PricingTier" ADD CONSTRAINT "PricingTier_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "public"."PricingPage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."QuickEstimate" ADD CONSTRAINT "QuickEstimate_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "public"."PricingPage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
