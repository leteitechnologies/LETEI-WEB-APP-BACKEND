-- CreateTable
CREATE TABLE "public"."ProductPage" (
    "id" SERIAL NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "url" TEXT,
    "image" TEXT,
    "keywords" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "features" JSONB,
    "integrations" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "useCases" JSONB,
    "faq" JSONB,
    "metrics" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductPage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CaseStudy" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "client" TEXT NOT NULL,
    "sector" TEXT NOT NULL,
    "timeline" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "readTime" INTEGER,
    "short" TEXT,
    "problem" TEXT NOT NULL,
    "approach" TEXT,
    "solution" TEXT NOT NULL,
    "results" JSONB,
    "metrics" JSONB,
    "platforms" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "quote" JSONB,
    "team" JSONB,
    "techStack" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "resources" JSONB,
    "seo" JSONB,
    "images" JSONB,
    "draft" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CaseStudy_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProductPage_slug_key" ON "public"."ProductPage"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "CaseStudy_slug_key" ON "public"."CaseStudy"("slug");
