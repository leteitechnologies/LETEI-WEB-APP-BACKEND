
// src/pricing/quick-estimate.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { Prisma } from '@prisma/client';

@Injectable()
export class QuickEstimateService {
  private readonly logger = new Logger(QuickEstimateService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createManyForPage(tx: Prisma.TransactionClient | undefined, pageId: number, items: any[]) {
    const client = tx ?? this.prisma;
    if (!Array.isArray(items) || items.length === 0) return;
    await client.quickEstimate.createMany({
      data: items.map(q => ({
        pageId,
        label: q.label ?? null,
        low: Number(q.low ?? 0),
        high: Number(q.high ?? 0),
        note: q.note ?? null,
      })),
    });
  }

  async deleteManyForPage(pageId: number) {
    return this.prisma.quickEstimate.deleteMany({ where: { pageId } });
  }
}
export default QuickEstimateService;






