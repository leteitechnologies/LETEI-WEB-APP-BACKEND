// src/pricing/pricing-tier.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { Prisma } from '@prisma/client';

@Injectable()
export class PricingTierService {
  private readonly logger = new Logger(PricingTierService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a tier for a page using either tx (transaction client) or the root prisma client.
   * Returns the created tier record.
   */
  async createForPage(
    tx: Prisma.TransactionClient | undefined,
    pageId: number,
    payload: any,
  ) {
    const client = tx ?? this.prisma;
    const created = await client.pricingTier.create({
      data: {
        pageId,
        title: payload.title ?? '',
        tagline: payload.tagline ?? null,
        taglineParts: Array.isArray(payload.taglineParts) ? payload.taglineParts : [],
        rangeUsd: Array.isArray(payload.rangeUsd) ? payload.rangeUsd.map(Number) : [],
        bullets: Array.isArray(payload.bullets) ? payload.bullets : [],
        highlight: !!payload.highlight,
        details: payload.details ?? payload.exampleScope ?? null,

        // structured fields (prefer provided mapping)
        estimatedTimelineWeeks: Array.isArray(payload.estimatedTimelineWeeks)
          ? payload.estimatedTimelineWeeks.map(Number)
          : [],
        typicalDeliverables: Array.isArray(payload.typicalDeliverables) ? payload.typicalDeliverables : [],
        assumptions: Array.isArray(payload.assumptions) ? payload.assumptions : [],
        exclusions: Array.isArray(payload.exclusions) ? payload.exclusions : [],
        typicalTeam: payload.typicalTeam ?? null,
        costBreakdown: payload.costBreakdown ?? null,
        paymentMilestones: payload.paymentMilestones ?? null,
        recommendedBudgetGuidance: payload.recommendedBudgetGuidance ?? null,
        exampleScope: payload.exampleScope ?? null,
      },
    });

    return created;
  }

  async deleteManyForPage(pageId: number) {
    return this.prisma.pricingTier.deleteMany({ where: { pageId } });
  }

  async findByPage(pageId: number) {
    return this.prisma.pricingTier.findMany({
      where: { pageId },
      include: { whyItems: true },
      orderBy: { id: 'asc' },
    });
  }
}
export default PricingTierService;
