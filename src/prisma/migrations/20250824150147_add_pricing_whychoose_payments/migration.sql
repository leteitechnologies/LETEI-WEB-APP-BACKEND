-- CreateTable
CREATE TABLE "public"."WhyChooseUsItem" (
    "id" SERIAL NOT NULL,
    "pageId" INTEGER NOT NULL,
    "icon" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "WhyChooseUsItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PaymentMethod" (
    "id" SERIAL NOT NULL,
    "pageId" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "logoSrc" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "PaymentMethod_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."WhyChooseUsItem" ADD CONSTRAINT "WhyChooseUsItem_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "public"."PricingPage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PaymentMethod" ADD CONSTRAINT "PaymentMethod_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "public"."PricingPage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
