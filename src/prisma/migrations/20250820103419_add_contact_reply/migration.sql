-- CreateTable
CREATE TABLE "public"."ContactReply" (
    "id" SERIAL NOT NULL,
    "contactSubmissionId" INTEGER NOT NULL,
    "message" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContactReply_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."ContactReply" ADD CONSTRAINT "ContactReply_contactSubmissionId_fkey" FOREIGN KEY ("contactSubmissionId") REFERENCES "public"."ContactSubmission"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
