/*
  Warnings:

  - You are about to drop the column `coverImage` on the `BlogPost` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[coverImageId]` on the table `BlogPost` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "public"."BlogPost" DROP COLUMN "coverImage",
ADD COLUMN     "coverImageId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "BlogPost_coverImageId_key" ON "public"."BlogPost"("coverImageId");

-- AddForeignKey
ALTER TABLE "public"."BlogPost" ADD CONSTRAINT "BlogPost_coverImageId_fkey" FOREIGN KEY ("coverImageId") REFERENCES "public"."Image"("id") ON DELETE SET NULL ON UPDATE CASCADE;
