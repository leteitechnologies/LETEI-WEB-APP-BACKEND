/*
  Warnings:

  - You are about to drop the column `slug` on the `PricingPage` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "public"."PricingPage_slug_key";

-- AlterTable
ALTER TABLE "public"."PricingPage" DROP COLUMN "slug";
