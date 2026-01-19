-- AlterTable
ALTER TABLE "public"."ContactReply" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "public"."ContactSubmission" ADD COLUMN     "deletedAt" TIMESTAMP(3);
