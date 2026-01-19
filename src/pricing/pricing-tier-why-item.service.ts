// src/pricing/pricing-tier-why-item.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { Prisma } from '@prisma/client';

@Injectable()
export class PricingTierWhyItemService {
  private readonly logger = new Logger(PricingTierWhyItemService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createForTier(
    tx: Prisma.TransactionClient | undefined,
    tierId: number,
    whyItem: any,
    orderFallback = 0,
  ) {
    const client = tx ?? this.prisma;
    return client.pricingTierWhyItem.create({
      data: {
        tierId,
        icon: whyItem.icon ?? null,
        title: whyItem.title ?? '',
        description: whyItem.description ?? null,
        order: typeof whyItem.order === 'number' ? whyItem.order : orderFallback,
      },
    });
  }

  async createManyForTier(
    tx: Prisma.TransactionClient | undefined,
    tierId: number,
    items: any[],
  ) {
    const client = tx ?? this.prisma;
    if (!Array.isArray(items) || items.length === 0) return [];
    // Prefer to create one-by-one so we can set order defaults reliably.
    const created: any[] = [];
    for (let i = 0; i < items.length; i++) {
      const w = items[i];
      const rec = await client.pricingTierWhyItem.create({
        data: {
          tierId,
          icon: w.icon ?? null,
          title: w.title ?? '',
          description: w.description ?? null,
          order: typeof w.order === 'number' ? w.order : i,
        },
      });
      created.push(rec);
    }
    return created;
  }

  async update(id: string, patch: Partial<any>) {
    return this.prisma.pricingTierWhyItem.update({ where: { id }, data: patch });
  }

  async delete(id: string) {
    return this.prisma.pricingTierWhyItem.delete({ where: { id } });
  }

  async deleteManyForTier(tierId: number) {
    return this.prisma.pricingTierWhyItem.deleteMany({ where: { tierId } });
  }
}
export default PricingTierWhyItemService;

