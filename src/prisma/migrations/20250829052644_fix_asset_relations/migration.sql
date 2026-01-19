/*
  Warnings:

  - You are about to drop the `Image` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "public"."AssetStatus" AS ENUM ('uploading', 'processing', 'ready', 'failed');

-- DropForeignKey
ALTER TABLE "public"."BlogPost" DROP CONSTRAINT "BlogPost_coverImageId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Image" DROP CONSTRAINT "Image_postId_fkey";

-- DropTable
DROP TABLE "public"."Image";

-- CreateTable
CREATE TABLE "public"."Asset" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "key" TEXT,
    "originalName" TEXT,
    "alt" TEXT,
    "caption" TEXT,
    "width" INTEGER,
    "height" INTEGER,
    "size" INTEGER,
    "mimeType" TEXT,
    "role" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "meta" JSONB,
    "derivatives" JSONB,
    "status" "public"."AssetStatus" NOT NULL DEFAULT 'uploading',
    "checksum" TEXT,
    "idempotencyKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "postId" TEXT,
    "uploadedBy" TEXT,

    CONSTRAINT "Asset_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Asset_checksum_key" ON "public"."Asset"("checksum");

-- CreateIndex
CREATE UNIQUE INDEX "Asset_idempotencyKey_key" ON "public"."Asset"("idempotencyKey");

-- CreateIndex
CREATE INDEX "Asset_postId_idx" ON "public"."Asset"("postId");

-- CreateIndex
CREATE INDEX "Asset_status_idx" ON "public"."Asset"("status");

-- AddForeignKey
ALTER TABLE "public"."BlogPost" ADD CONSTRAINT "BlogPost_coverImageId_fkey" FOREIGN KEY ("coverImageId") REFERENCES "public"."Asset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Asset" ADD CONSTRAINT "Asset_postId_fkey" FOREIGN KEY ("postId") REFERENCES "public"."BlogPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;
