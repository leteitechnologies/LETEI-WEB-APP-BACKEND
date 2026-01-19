import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { v2 as cloudinary } from 'cloudinary';
import streamifier from 'streamifier';
import crypto from 'crypto';
import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import { CreateAssetFromUrlDto } from './dto/create-asset-from-url.dto';

const redis = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379');
const imageQueue = new Queue('image-processing', { connection: redis });

@Injectable()
export class ImagesService {
  private readonly logger = new Logger(ImagesService.name);

  constructor(private prisma: PrismaService) {
    // cloudinary config if provided
    if (process.env.CLOUDINARY_CLOUD_NAME) {
      cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
      });
    }
  }

  // compute SHA256 checksum
  private checksum(buffer: Buffer) {
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }

  // Create DB asset record (idempotent by checksum or idempotencyKey)
  async createAssetRecordFromBuffer(buffer: Buffer, opts: {
    filename?: string;
    alt?: string;
    caption?: string;
    role?: string;
    idempotencyKey?: string;
    uploadedBy?: string;
  } = {}) {
    const cs = this.checksum(buffer);

    // Check existing by checksum first
    const existing = await this.prisma.asset.findUnique({ where: { checksum: cs } }).catch(() => null);
    if (existing) {
      return existing;
    }

    // Check by idempotencyKey
    if (opts.idempotencyKey) {
      const byKey = await this.prisma.asset.findUnique({ where: { idempotencyKey: opts.idempotencyKey } }).catch(() => null);
      if (byKey) return byKey;
    }

    // Create record with status uploading -> processing will be set when upload finishes
const rec = await this.prisma.asset.create({
  data: {
    url: '', // temporary placeholder
    originalname: opts.filename,
    alt: opts.alt,
    caption: opts.caption,
    mimetype: undefined,
    size: buffer.length,
    status: 'uploading',
    checksum: cs,
    idempotencyKey: opts.idempotencyKey,
    uploadedBy: opts.uploadedBy,
  },
});



    return { record: rec, checksum: cs };
  }

  // Upload to Cloudinary and update DB record; enqueue processing if needed
  async uploadBuffer(buffer: Buffer, opts: {
    filename?: string;
    folder?: string;
    alt?: string;
    caption?: string;
    role?: string;
    postId?: string | null;
    idempotencyKey?: string;
    uploadedBy?: string;
    mimetype?: string;     
  } = {}) {
    const folder = opts.folder ?? process.env.CLOUDINARY_FOLDER ?? 'blogs';

    // create DB record or return existing
    const maybe = await this.createAssetRecordFromBuffer(buffer, {
      filename: opts.filename,
      alt: opts.alt,
      caption: opts.caption,
      role: opts.role,
      idempotencyKey: opts.idempotencyKey,
      uploadedBy: opts.uploadedBy,
    });

    // If createAssetRecordFromBuffer returned an existing asset, return it
    if ((maybe as any).id) {
      // existing asset found by checksum
      const asset = maybe as any;
      // optionally attach to post immediately if requested
      if (opts.postId && !asset.postId) {
        await this.prisma.asset.update({ where: { id: asset.id }, data: { post: { connect: { id: opts.postId } } } });
      }
      return asset;
    }

    // else we received { record, checksum } pair
    const { record, checksum } = maybe as any;

    // Upload to Cloudinary if configured
    if (process.env.CLOUDINARY_CLOUD_NAME) {
      const publicId = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
      const result: any = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { public_id: publicId, folder, resource_type: 'image', overwrite: false },
          (error, res) => (error ? reject(error) : resolve(res))
        );
        streamifier.createReadStream(buffer).pipe(uploadStream);
      });

      // update DB record with URL and meta, set status -> processing OR ready depending on if transforms required
const updated = await this.prisma.asset.update({
  where: { id: record.id },
  data: {
    url: result.secure_url,
    key: result.public_id,
    width: result.width,
    height: result.height,
    size: result.bytes,
    mimetype: result.format,         // <-- corrected
    meta: { raw: result },
    status: 'ready',
    checksum,
    post: opts.postId ? { connect: { id: opts.postId } } : undefined,
    originalname: opts.filename,     // <-- corrected
  },
});


      // enqueue a processing job for derivative generation / DB enrichment if necessary
      await imageQueue.add('post-upload', { assetId: updated.id }, { attempts: 3, backoff: { type: 'exponential', delay: 2000 } });

      return updated;
    }

    // If Cloudinary isn't configured, enqueue for alternative processing (e.g., we would store buffer in S3)
    // Fallback behavior: mark as processing and enqueue job that expects S3 presigned flow.
    await this.prisma.asset.update({ where: { id: record.id }, data: { status: 'processing' } });
    await imageQueue.add('post-upload', { assetId: record.id, fallback: true }, { attempts: 3 });

    return record;
  }

  // List assets by post
  async listByPost(postId: string) {
    return this.prisma.asset.findMany({ where: { postId }, orderBy: { order: 'asc' } });
  }

  // Get asset by id
  async getById(id: string) {
    return this.prisma.asset.findUnique({ where: { id } });
  }

  // Delete asset (storage + db)
  async delete(id: string) {
    const img = await this.prisma.asset.findUnique({ where: { id } });
    if (!img) throw new Error('Asset not found');

    // try delete from cloudinary if key present
    if (img.key && process.env.CLOUDINARY_CLOUD_NAME) {
      try {
        await cloudinary.uploader.destroy(img.key, { resource_type: 'image' });
      } catch (err) {
        this.logger.warn(`Cloudinary delete failed for ${img.key}: ${err?.message ?? err}`);
      }
    }

    return this.prisma.asset.delete({ where: { id } });
  }

  // Update metadata (alt/caption/role/order/derivatives)
  async updateMetadata(id: string, data: Partial<any>) {
    return this.prisma.asset.update({ where: { id }, data });
  }

  // Attach assets to post and set ordering atomically
  async attachAssetsToPost(postId: string, assetIds: string[]) {
    // Use transaction to set postId and ordering
    return this.prisma.$transaction(async (tx) => {
      // attach and set order for provided assets
      const updates = assetIds.map((aid, idx) =>
        tx.asset.update({ where: { id: aid }, data: { post: { connect: { id: postId } }, order: idx } })
      );
      await Promise.all(updates);
      return tx.blogPost.update({
        where: { id: postId },
        data: {},
        include: { images: true, coverImage: true },
      });
    });
  }
  /**
 * Create an Asset DB record from an already-hosted URL (Cloudinary etc).
 * Assumes the file is already uploaded externally and ready.
 */
async createFromUrl(dto: CreateAssetFromUrlDto) {
  const { url, postId, alt, caption, role, key, width, height } = dto as any;

  // optionally: restrict to cloudinary host (uncomment if desired)
  // if (!url.includes('res.cloudinary.com')) throw new BadRequestException('Only Cloudinary URLs are accepted');

  const data: any = {
    url,
    alt: alt ?? null,
    caption: caption ?? null,
    role: role ?? null,
    key: key ?? null,
    width: width ?? null,
    height: height ?? null,
    status: 'ready',    // the file is already uploaded
  };

  if (postId) {
    data.post = { connect: { id: postId } };
  }

  const asset = await this.prisma.asset.create({ data });
  return asset;
}
}
