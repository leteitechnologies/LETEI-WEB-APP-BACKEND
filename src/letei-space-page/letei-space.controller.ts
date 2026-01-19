import { Controller, Get, Param, Query, Post, Put, Delete, Body, NotFoundException } from '@nestjs/common';
import { LeteiSpaceService } from './letei-space.service';

@Controller('letei-space')
export class LeteiSpaceController {
  constructor(private readonly svc: LeteiSpaceService) {}

  // PUBLIC: GET /letei-space/:slug?currency=KES
@Get(':slug')
async get(@Param('slug') slug: string, @Query('currency') currency?: string) {
  const cur = (currency || 'USD').toUpperCase();
  const page = await this.svc.getPage(slug, cur);
  if (!page) throw new NotFoundException({ message: 'Letei Space page not found', slug });
  return page;
}
  // ADMIN: Create a new page (body contains full payload)
  @Post(':slug')
  async create(@Param('slug') slug: string, @Body() body: any) {
    return this.svc.upsertPage(slug, body);
  }

  // ADMIN: Update existing page
  @Put(':slug')
  async update(@Param('slug') slug: string, @Body() body: any) {
    return this.svc.upsertPage(slug, body);
  }

  // ADMIN: delete
  @Delete(':slug')
  async remove(@Param('slug') slug: string) {
    return this.svc.deletePage(slug);
  }

  // ADMIN: cache control endpoint: POST /letei-space/cache/invalidate
  @Post('cache/invalidate')
  async invalidateCache(@Body() body: { slug?: string; currencies?: string[]; bumpVersion?: boolean }) {
    const slug = body?.slug;
    const { currencies, bumpVersion } = body ?? {};
    if (bumpVersion) {
      const v = await this.svc.bumpCacheVersion();
      return { ok: true, bumped: v };
    }
    if (!slug) {
      return { ok: false, error: 'Missing slug to invalidate' };
    }
    await this.svc.invalidateCurrencies(slug, currencies ?? ['USD', ...(process.env.LETEI_PREWARM_CURRENCIES?.split(',') ?? [])]);
    return { ok: true, invalidated: currencies ?? 'ALL_PREWARMED' };
  }
}
export default LeteiSpaceController;
