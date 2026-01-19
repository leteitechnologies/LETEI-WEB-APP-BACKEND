-- AlterTable
ALTER TABLE "public"."BlogPost" ADD COLUMN     "cta" JSONB;

-- CreateTable
CREATE TABLE "public"."Image" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "key" TEXT,
    "alt" TEXT,
    "caption" TEXT,
    "width" INTEGER,
    "height" INTEGER,
    "size" INTEGER,
    "mimeType" TEXT,
    "role" TEXT,
    "blurhash" TEXT,
    "focalPoint" JSONB,
    "order" INTEGER NOT NULL DEFAULT 0,
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "postId" TEXT,
    "uploadedBy" TEXT,

    CONSTRAINT "Image_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Image_postId_idx" ON "public"."Image"("postId");

-- CreateIndex
CREATE INDEX "Image_role_idx" ON "public"."Image"("role");

-- AddForeignKey
ALTER TABLE "public"."Image" ADD CONSTRAINT "Image_postId_fkey" FOREIGN KEY ("postId") REFERENCES "public"."BlogPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;
