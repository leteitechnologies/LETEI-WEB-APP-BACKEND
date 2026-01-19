-- CreateTable
CREATE TABLE "public"."NewsletterSubscription" (
    "id" SERIAL NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "userAgent" TEXT,
    "ip" TEXT,
    "idempotencyKey" TEXT,
    "messageId" TEXT,
    "privacyConsent" BOOLEAN NOT NULL DEFAULT false,
    "status" "public"."SubmissionStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NewsletterSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "NewsletterSubscription_email_key" ON "public"."NewsletterSubscription"("email");

-- CreateIndex
CREATE UNIQUE INDEX "NewsletterSubscription_idempotencyKey_key" ON "public"."NewsletterSubscription"("idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "NewsletterSubscription_messageId_key" ON "public"."NewsletterSubscription"("messageId");

-- CreateIndex
CREATE INDEX "NewsletterSubscription_createdAt_idx" ON "public"."NewsletterSubscription"("createdAt");
