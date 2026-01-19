// scripts/migrate-images-to-assets.js
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function pgIntToNumber(rowCount) {
  // Postgres COUNT() may be string/bigint depending on driver; normalize to number
  return typeof rowCount === 'number' ? rowCount : Number(rowCount);
}

async function migrateImagesToAssets(batchSize = 200) {
  console.log('Starting Image -> Asset migration (raw read from "Image" table)');

  // Check that Asset model exists by calling count (will throw if not)
  try {
    await prisma.asset.count();
  } catch (e) {
    console.error('prisma.asset is not available. Ensure schema.prisma defines Asset and run `npx prisma generate`.');
    throw e;
  }

  // Use raw SQL to count rows in Image (avoids needing prisma.image)
  const countRes = await prisma.$queryRaw`SELECT COUNT(*)::text as cnt FROM "Image"`;
  const totalImages = pgIntToNumber(countRes?.[0]?.cnt ?? 0);
  console.log(`Found ${totalImages} rows in "Image"`);

  let processed = 0;
  for (let offset = 0; offset < totalImages; offset += batchSize) {
    // select a batch of rows; adjust columns if your Image table has different column names
    const rows = await prisma.$queryRawUnsafe(
      `SELECT * FROM "Image" ORDER BY "createdAt" NULLS LAST LIMIT $1 OFFSET $2`,
      batchSize,
      offset
    );

    if (!Array.isArray(rows) || rows.length === 0) {
      console.log('No more rows.');
      break;
    }

    for (const img of rows) {
      try {
        // Map source columns -> Asset fields.
        // Adjust property names if your Image table uses different column names.
        const id = img.id;
        const url = img.url;
        const key = img.key ?? null;
 
        const alt = img.alt ?? null;
        const caption = img.caption ?? null;
        const width = img.width ?? null;
        const height = img.height ?? null;
        const size = img.size ?? null;
    
        const role = img.role ?? null;
        const order = typeof img.order === 'number' ? img.order : (img.order ? Number(img.order) : 0);
        const meta = img.meta ?? null;
        const createdAt = img.createdAt ? new Date(img.createdAt) : undefined;
        const updatedAt = img.updatedAt ? new Date(img.updatedAt) : undefined;
        const postId = img.postId ?? null;
        const uploadedBy = img.uploadedBy ?? null;

        // Upsert into Asset while preserving the original id (so FK's remain valid)
// Upsert into Asset while preserving the original id (so FK's remain valid)
const originalName = img.originalName ?? img.caption ?? null;
const mimeType = img.mimeType ?? null; // variable in camelCase

await prisma.asset.upsert({
  where: { id },
  create: {
    id,
    url,
    key,
    originalname: originalName, // Prisma field
    alt,
    caption,
    width: width !== null ? width : undefined,
    height: height !== null ? height : undefined,
    size: size !== null ? size : undefined,
    mimetype: mimeType, // Prisma field mapped from variable
    role,
    order,
    meta,
    status: 'ready',
    createdAt: createdAt ?? undefined,
    updatedAt: updatedAt ?? undefined,
    postId,
    uploadedBy,
  },
  update: {
    url,
    key: key ?? undefined,
    originalname: originalName ?? undefined, // Prisma field
    alt: alt ?? undefined,
    caption: caption ?? undefined,
    width: width !== null ? width : undefined,
    height: height !== null ? height : undefined,
    size: size !== null ? size : undefined,
    mimetype: mimeType ?? undefined, // Prisma field
    role: role ?? undefined,
    order,
    meta: meta ?? undefined,
    status: 'ready',
    postId: postId ?? undefined,
    uploadedBy: uploadedBy ?? undefined,
    updatedAt: updatedAt ?? new Date(),
  },
});



        processed++;
      } catch (err) {
        console.error(`Error migrating image id=${img.id}:`, err);
      }
    }

    console.log(`Processed batch offset=${offset} (total processed so far: ${processed})`);
  }

  const finalAssetCount = await prisma.asset.count();
  console.log(`Migration done — assets now: ${finalAssetCount}`);
  return { totalImages, processed, finalAssetCount };
}

async function migrateLegacyCoverImages() {
  // For posts with a legacyCoverImage string, create an asset if no coverImageId exists.
  console.log('Migrating legacyCoverImage strings to Asset + linking to post');

  const posts = await prisma.blogPost.findMany({
    where: { legacyCoverImage: { not: null } },
    select: { id: true, title: true, legacyCoverImage: true, coverImageId: true },
  });

  let created = 0;
  for (const p of posts) {
    if (!p.legacyCoverImage) continue;
    if (p.coverImageId) {
      console.log(`Post ${p.id} already has coverImageId=${p.coverImageId} - skipping legacyCoverImage`);
      continue;
    }

    // Create asset and link
    const asset = await prisma.asset.create({
      data: {
        url: p.legacyCoverImage,
        role: 'cover',
        caption: `Migrated cover for post ${p.id}`,
        status: 'ready',
        postId: p.id,
      },
    });

    await prisma.blogPost.update({
      where: { id: p.id },
      data: { coverImageId: asset.id },
    });

    console.log(`Created asset ${asset.id} for post ${p.id}`);
    created++;
  }

  console.log(`Migrated ${created} legacyCoverImage -> Asset`);
  return created;
}

async function verifyCounts() {
  const imageCountRes = await prisma.$queryRaw`SELECT COUNT(*)::text as cnt FROM "Image"`;
  const imageCount = pgIntToNumber(imageCountRes?.[0]?.cnt ?? 0);
  const assetCount = await prisma.asset.count();
  const postsWithCover = await prisma.blogPost.count({ where: { coverImageId: { not: null } } });

  console.log('=== Verification ===');
  console.log(`Image rows (raw table): ${imageCount}`);
  console.log(`Asset rows: ${assetCount}`);
  console.log(`Posts with coverImageId: ${postsWithCover}`);
}

async function main() {
  try {
    const result = await migrateImagesToAssets(200);
    console.log('migrateImagesToAssets result:', result);

    const legacyCreated = await migrateLegacyCoverImages();
    console.log('migrateLegacyCoverImages created:', legacyCreated);

    await verifyCounts();

    console.log('Migration script finished. Please verify results before dropping "Image" table.');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
