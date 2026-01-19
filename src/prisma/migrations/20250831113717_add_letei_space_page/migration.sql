-- CreateTable
CREATE TABLE "public"."LeteiSpacePage" (
    "id" SERIAL NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "description" TEXT,
    "hero" JSONB,
    "plans" JSONB,
    "integrations" JSONB,
    "whyChoose" JSONB,
    "faq" JSONB,
    "testimonials" JSONB,
    "features" JSONB,
    "technicalNotes" JSONB,
    "trustedMetrics" JSONB,
    "cta" JSONB,
    "seo" JSONB,
    "currency" TEXT,
    "conversionRate" DOUBLE PRECISION,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeteiSpacePage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LeteiSpacePage_slug_key" ON "public"."LeteiSpacePage"("slug");

-- CreateIndex
CREATE INDEX "LeteiSpacePage_createdAt_idx" ON "public"."LeteiSpacePage"("createdAt");
