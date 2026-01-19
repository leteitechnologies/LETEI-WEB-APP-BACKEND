import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { PrismaService } from '../prisma/prisma.service';
import slugify from 'slugify';
import { normalizeHtml } from 'src/utils/normalizeHtml';
import { ImagesService } from 'src/images/images.service';

@Injectable()
export class BlogService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly httpService: HttpService,
    private readonly imagesService: ImagesService,
  ) {}

  private makeSlug(title: string, provided?: string) {
    const base = provided?.trim().length ? provided : title;
    return slugify(base, { lower: true, strict: true }).slice(0, 200);
  }


  async findById(id: string, includeDrafts = true) {
    const where: any = { id };
    if (!includeDrafts) where.draft = false;
    return this.prisma.blogPost.findUnique({ where });
  }

 

// src/blog/blog.service.ts (partial)
// update findMany signature:
async findMany(params: { page?: number; perPage?: number; tag?: string; q?: string; featured?: boolean; includeDrafts?: boolean; authorId?: string }) {
  const { page = 1, perPage = 10, tag, q, featured, includeDrafts, authorId } = params;
  const where: any = {};
  if (!includeDrafts) where.draft = false;
  if (featured !== undefined) where.featured = featured;
  if (tag) where.tags = { has: tag };
  if (authorId) where.authorId = authorId;
  if (q) where.OR = [
    { title: { contains: q, mode: 'insensitive' } },
    { excerpt: { contains: q, mode: 'insensitive' } },
    { content: { contains: q, mode: 'insensitive' } },
  ];

  const [total, items] = await Promise.all([
    this.prisma.blogPost.count({ where }),
    this.prisma.blogPost.findMany({
      where,
      orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
      skip: (page - 1) * perPage,
      take: perPage,
      include: { coverImage: true, images: true, author: true },
    }),
  ]);

  return { items, total, page, perPage, totalPages: Math.ceil(total / perPage) };
}

// update findBySlug to include author too
async findBySlug(slug: string, includeDrafts = false) {
  const where: any = { slug };
  if (!includeDrafts) where.draft = false;
  return this.prisma.blogPost.findUnique({ where, include: { coverImage: true, images: true, author: true } });
}

// create/update: accept authorId
async create(data: any) {
  const cleaned = normalizeHtml(data.content || '');
  const slug = this.makeSlug(data.title, data.slug);
  const imageConnect = Array.isArray(data.imageIds) ? data.imageIds.map((id: string) => ({ id })) : undefined;

  const post = await this.prisma.blogPost.create({
    data: {
      title: data.title,
      excerpt: data.excerpt,
      slug,
      content: cleaned,
      keywords: data.keywords,
      tags: data.tags,
      readTime: data.readTime,
      featured: data.featured,
      draft: data.draft,
      seo: data.seo,
      meta: data.meta,
      cta: data.cta,
      coverImage: data.coverImageId ? { connect: { id: data.coverImageId } } : undefined,
      legacyCoverImage: data.coverImageUrl ?? undefined,
      images: imageConnect ? { connect: imageConnect } : undefined,
      author: data.authorId ? { connect: { id: data.authorId } } : undefined,
    },
    include: { coverImage: true, images: true, author: true },
  });

  if (data.imageIds && data.imageIds.length) {
    await this.imagesService.attachAssetsToPost(post.id, data.imageIds);
  }

  return post;
}

async update(id: string, data: any) {
  if (data.title && !data.slug) data.slug = this.makeSlug(data.title);
  const imageConnect = Array.isArray(data.imageIds) ? data.imageIds.map((id: string) => ({ id })) : undefined;

  const updateData: any = {
    title: data.title,
    excerpt: data.excerpt,
    slug: data.slug,
    content: normalizeHtml(data.content ?? ''),
    keywords: data.keywords,
    tags: data.tags,
    readTime: data.readTime,
    featured: data.featured,
    draft: data.draft,
    seo: data.seo,
    meta: data.meta,
    cta: data.cta,
    coverImage: data.coverImageId ? { connect: { id: data.coverImageId } } : data.coverImageId === null ? { disconnect: true } : undefined,
    legacyCoverImage: data.coverImageUrl === null ? null : data.coverImageUrl ?? undefined,
    images: imageConnect ? { set: imageConnect } : undefined,
  };

  // author connect/disconnect
  if (data.hasOwnProperty('authorId')) {
    if (data.authorId === null) updateData.author = { disconnect: true };
    else if (data.authorId) updateData.author = { connect: { id: data.authorId } };
  }

  const updated = await this.prisma.blogPost.update({
    where: { id },
    data: updateData,
    include: { coverImage: true, images: true, author: true },
  });

  if (Array.isArray(data.imageIds) && data.imageIds.length) {
    await this.imagesService.attachAssetsToPost(updated.id, data.imageIds);
  }

  return updated;
}




  async delete(id: string) {
    return this.prisma.blogPost.delete({ where: { id } });
  }

  async publish(id: string) {
    const post = await this.prisma.blogPost.update({
      where: { id },
      data: { draft: false, publishedAt: new Date() },
    });

    const revalidateUrl = process.env.NEXT_REVALIDATE_URL;
    const revalidateSecret = process.env.NEXT_REVALIDATE_SECRET;

    if (revalidateUrl) {
      try { await this.httpService.post(revalidateUrl, { slug: post.slug, secret: revalidateSecret }).toPromise(); }
      catch (err) { console.warn('revalidate webhook failed', err?.message ?? err); }
    }

    return post;
  }
}
