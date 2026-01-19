/*
  Warnings:

  - You are about to drop the column `mimeType` on the `Asset` table. All the data in the column will be lost.
  - You are about to drop the column `originalName` on the `Asset` table. All the data in the column will be lost.
  - The `status` column on the `Asset` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- DropForeignKey
ALTER TABLE "public"."Asset" DROP CONSTRAINT "Asset_postId_fkey";

-- DropForeignKey
ALTER TABLE "public"."BlogPost" DROP CONSTRAINT "BlogPost_coverImageId_fkey";

-- DropIndex
DROP INDEX "public"."Asset_postId_idx";

-- DropIndex
DROP INDEX "public"."Asset_status_idx";

-- AlterTable
ALTER TABLE "public"."Asset" DROP COLUMN "mimeType",
DROP COLUMN "originalName",
ADD COLUMN     "mimetype" TEXT,
ADD COLUMN     "originalname" TEXT,
ALTER COLUMN "id" SET DEFAULT gen_random_uuid(),
ALTER COLUMN "order" DROP NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" TEXT DEFAULT 'uploading',
ALTER COLUMN "createdAt" DROP NOT NULL,
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(6),
ALTER COLUMN "updatedAt" DROP NOT NULL,
ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMP(6);

-- CreateTable
CREATE TABLE "public"."Image" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "key" TEXT,
    "alt" TEXT,
    "caption" TEXT,
    "width" INTEGER,
    "height" INTEGER,
    "size" INTEGER,
    "mimeType" TEXT,
    "role" TEXT,
    "blurhash" TEXT,
    "focalPoint" JSONB,
    "order" INTEGER NOT NULL DEFAULT 0,
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "postId" TEXT,
    "uploadedBy" TEXT,

    CONSTRAINT "Image_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Image_postId_idx" ON "public"."Image"("postId");

-- CreateIndex
CREATE INDEX "Image_role_idx" ON "public"."Image"("role");

-- AddForeignKey
ALTER TABLE "public"."BlogPost" ADD CONSTRAINT "BlogPost_coverImageId_fkey" FOREIGN KEY ("coverImageId") REFERENCES "public"."Image"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Asset" ADD CONSTRAINT "Asset_postId_fkey" FOREIGN KEY ("postId") REFERENCES "public"."BlogPost"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."Image" ADD CONSTRAINT "Image_postId_fkey" FOREIGN KEY ("postId") REFERENCES "public"."BlogPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;
