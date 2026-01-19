import { Worker } from 'bullmq';
import IORedis from 'ioredis';
import { PrismaClient } from '@prisma/client';
import cloudinary from 'cloudinary';


const prisma = new PrismaClient();
const redis = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379');

if (process.env.CLOUDINARY_CLOUD_NAME) {
  cloudinary.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

const worker = new Worker('image-processing', async job => {
  if (job.name !== 'post-upload') return;

  const { assetId, fallback } = job.data;
  const asset = await prisma.asset.findUnique({ where: { id: assetId } });
  if (!asset) throw new Error('asset missing');

  try {
    // If Cloudinary already provided final URL and metadata (status ready) we can optionally generate derivatives
    if (asset.key && process.env.CLOUDINARY_CLOUD_NAME) {
      // example: generate a thumbnail and webp derivative urls (Cloudinary transformations)
      const thumb = cloudinary.v2.url(asset.key, { width: 400, height: 300, crop: 'fill', format: 'jpg' });
      const webp = cloudinary.v2.url(asset.key, { transformation: [{ fetch_format: 'webp' }] });
      const derivatives = { thumb, webp };
      await prisma.asset.update({ where: { id: assetId }, data: { derivatives, status: 'ready' } });
      return;
    }

    // Fallback: if asset has no key, but we stored a temporary S3 key, you'd fetch and process here.
    // For now mark as failed to signal need for manual action:
    await prisma.asset.update({ where: { id: assetId }, data: { status: 'failed' } });
  } catch (err) {
    console.error('worker error', err);
    await prisma.asset.update({ where: { id: assetId }, data: { status: 'failed', meta: { error: String(err) } } });
    throw err;
  }
}, { connection: redis });

worker.on('completed', job => console.log('job completed', job.id));
worker.on('failed', (job, err) => console.error('job failed', job?.id, err));
