/*
  Warnings:

  - You are about to drop the column `social` on the `ContactPage` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "public"."SocialKind" AS ENUM ('linkedin', 'twitter', 'instagram', 'tiktok');

-- AlterTable
ALTER TABLE "public"."ContactPage" DROP COLUMN "social";

-- CreateTable
CREATE TABLE "public"."SocialLink" (
    "id" SERIAL NOT NULL,
    "kind" "public"."SocialKind" NOT NULL,
    "url" TEXT NOT NULL,
    "pageId" INTEGER NOT NULL,

    CONSTRAINT "SocialLink_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."SocialLink" ADD CONSTRAINT "SocialLink_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "public"."ContactPage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
