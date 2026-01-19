-- CreateTable
CREATE TABLE "JobApplication" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" TEXT,
    "notes" TEXT,
    "cvUrl" TEXT,
    "fileName" TEXT,
    "fileSize" INTEGER,
    "mimetype" TEXT,
    "userAgent" TEXT,
    "ip" TEXT,
    "idempotencyKey" TEXT,
    "messageId" TEXT,
    "status" "SubmissionStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobApplication_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "JobApplication_idempotencyKey_key" ON "JobApplication"("idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "JobApplication_messageId_key" ON "JobApplication"("messageId");

-- CreateIndex
CREATE INDEX "JobApplication_createdAt_idx" ON "JobApplication"("createdAt");
