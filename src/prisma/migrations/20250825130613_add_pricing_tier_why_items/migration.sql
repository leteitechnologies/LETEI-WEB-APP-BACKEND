-- CreateTable
CREATE TABLE "public"."PricingTierWhyItem" (
    "id" SERIAL NOT NULL,
    "tierId" INTEGER NOT NULL,
    "icon" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "PricingTierWhyItem_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."PricingTierWhyItem" ADD CONSTRAINT "PricingTierWhyItem_tierId_fkey" FOREIGN KEY ("tierId") REFERENCES "public"."PricingTier"("id") ON DELETE CASCADE ON UPDATE CASCADE;
