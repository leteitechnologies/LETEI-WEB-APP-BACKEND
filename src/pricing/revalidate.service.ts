import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class RevalidateService {
  private readonly logger = new Logger(RevalidateService.name);

  async revalidatePricing() {
    const url = process.env.NEXT_REVALIDATE_URL;
    const secret = process.env.REVALIDATE_SECRET;

    if (!url || !secret) {
      this.logger.warn('Revalidation skipped (missing env vars)');
      return;
    }

    try {
      const res = await fetch(`${url}?secret=${secret}`, {
        method: 'POST',
      });

      if (!res.ok) {
        this.logger.error(`Revalidation failed: ${res.status}`);
      } else {
        this.logger.log('Pricing page revalidated');
      }
    } catch (err: any) {
      this.logger.error('Revalidation error', err?.message);
    }
  }
}
