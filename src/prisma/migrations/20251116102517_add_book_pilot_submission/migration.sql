-- CreateEnum
CREATE TYPE "SubmissionStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "BookPilotSubmission" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "message" TEXT,
    "userAgent" TEXT,
    "ip" TEXT,
    "idempotencyKey" TEXT,
    "messageId" TEXT,
    "privacyConsent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),
    "status" "SubmissionStatus" NOT NULL DEFAULT 'PENDING',

    CONSTRAINT "BookPilotSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BookPilotSubmission_idempotencyKey_key" ON "BookPilotSubmission"("idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "BookPilotSubmission_messageId_key" ON "BookPilotSubmission"("messageId");

-- CreateIndex
CREATE INDEX "BookPilotSubmission_createdAt_idx" ON "BookPilotSubmission"("createdAt");
