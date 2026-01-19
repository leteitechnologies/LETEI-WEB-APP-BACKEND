-- DropForeignKey
ALTER TABLE "public"."ContactReply" DROP CONSTRAINT "ContactReply_contactSubmissionId_fkey";

-- AddForeignKey
ALTER TABLE "public"."ContactReply" ADD CONSTRAINT "ContactReply_contactSubmissionId_fkey" FOREIGN KEY ("contactSubmissionId") REFERENCES "public"."ContactSubmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
