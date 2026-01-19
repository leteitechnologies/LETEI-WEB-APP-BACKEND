

// src/pricing/why-choose.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { Prisma } from '@prisma/client';

@Injectable()
export class WhyChooseService {
  private readonly logger = new Logger(WhyChooseService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createManyForPage(tx: Prisma.TransactionClient | undefined, pageId: number, items: any[]) {
    const client = tx ?? this.prisma;
    if (!Array.isArray(items) || items.length === 0) return;
    await client.whyChooseUsItem.createMany({
      data: items.map((w, idx) => ({
        pageId,
        icon: w.icon ?? null,
        title: w.title ?? '',
        description: w.description ?? '',
        order: typeof w.order === 'number' ? w.order : idx,
      })),
    });
  }

  async deleteManyForPage(pageId: number) {
    return this.prisma.whyChooseUsItem.deleteMany({ where: { pageId } });
  }
}
export default WhyChooseService;
