// src/pricing/payment-method.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { Prisma } from '@prisma/client';

@Injectable()
export class PaymentMethodService {
  private readonly logger = new Logger(PaymentMethodService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createManyForPage(tx: Prisma.TransactionClient | undefined, pageId: number, items: any[]) {
    const client = tx ?? this.prisma;
    if (!Array.isArray(items) || items.length === 0) return;
    await client.paymentMethod.createMany({
      data: items.map((p, idx) => ({
        pageId,
        label: p.label ?? '',
        logoSrc: p.logoSrc ?? null,
        order: typeof p.order === 'number' ? p.order : idx,
      })),
    });
  }

  async deleteManyForPage(pageId: number) {
    return this.prisma.paymentMethod.deleteMany({ where: { pageId } });
  }
}
export default PaymentMethodService;
