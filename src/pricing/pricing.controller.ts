// src/pricing/pricing.controller.ts
import {
  Controller,
  Get,
  Query,
  Post,
  Put,
  Delete,
  Body,
  ValidationPipe,
} from '@nestjs/common';
import { PricingService } from './pricing.service';
import { CreatePricingDto } from './dto/create-pricing.dto';
import { RevalidateService } from './revalidate.service';

@Controller('pricing-page')
export class PricingController {
  constructor(
    private readonly svc: PricingService,
    private readonly revalidate: RevalidateService, // ✅ Inject
  ) {}
  // ======= PUBLIC ENDPOINTS =======

  @Get()
  async get(@Query('currency') currency?: string) {
    const cur = (currency || 'USD').toUpperCase();
    return this.svc.getPage(cur as 'USD' | 'KES');
  }

  @Post()
  async create(
    @Body(new ValidationPipe({ transform: true })) dto: CreatePricingDto,
  ) {
    return this.svc.upsertPage(dto);
  }

  @Put()
  async update(
    @Body(new ValidationPipe({ transform: true })) dto: CreatePricingDto,
  ) {
    return this.svc.upsertPage(dto);
  }

  @Delete()
  async remove() {
    return this.svc.deletePage();
  }

  // ======= ADMIN CACHE OPS =======

@Post('cache/invalidate')
async invalidateCache(
  @Body() body: { currencies?: string[]; bumpVersion?: boolean },
) {
  const { currencies, bumpVersion } = body;

  if (bumpVersion) {
    const version = await this.svc.bumpCacheVersion();
    // Revalidate after bumping version
    await this.revalidate.revalidatePricing();
    return { ok: true, bumped: version };
  }

  const target = currencies?.length
    ? currencies
    : ['USD', ...(process.env.PRICING_PREWARM_CURRENCIES?.split(',') ?? [])];

  await this.svc.invalidateCurrencies(target);

  // 🔥 Revalidate Next.js ISR after cache invalidation
  await this.revalidate.revalidatePricing();

  return { ok: true, invalidated: target };
}

}
