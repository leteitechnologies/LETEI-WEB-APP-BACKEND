-- CreateTable
CREATE TABLE "public"."PricingPage" (
    "id" SERIAL NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "description" TEXT,
    "heroImage" TEXT,
    "keywords" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "features" JSONB,
    "cta" JSONB,
    "seo" JSONB,
    "faq" JSONB,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PricingPage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PricingPage_slug_key" ON "public"."PricingPage"("slug");
