/*
  Warnings:

  - You are about to drop the `ProductPage` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "public"."ProductPage";

-- CreateTable
CREATE TABLE "public"."LeteiOnePage" (
    "id" SERIAL NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "url" TEXT,
    "image" TEXT,
    "keywords" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "features" JSONB,
    "integrations" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "useCases" JSONB,
    "faq" JSONB,
    "metrics" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "protected" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "LeteiOnePage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LeteiOnePage_slug_key" ON "public"."LeteiOnePage"("slug");
