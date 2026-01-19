import { Injectable, Inject, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FxService } from 'src/fx-rates/fx.service';
import { PricingTierService } from './pricing-tier.service';
import { PricingTierWhyItemService } from './pricing-tier-why-item.service';
import { QuickEstimateService } from './quick-estimate.service';
import { WhyChooseService } from './why-choose.service';
import { PaymentMethodService } from './payment-method.service';
import Redis from 'ioredis';
import { REDIS } from 'src/common/redis/redis.provider';
import type { Prisma } from '@prisma/client';
import { RevalidateService } from './revalidate.service';

@Injectable()
export class PricingService {
  private readonly logger = new Logger(PricingService.name);
  private readonly cacheTtlSeconds: number;
  private cacheVersion: string;
  private readonly prewarmCurrencies: string[];

  constructor(
    private readonly prisma: PrismaService,
    private readonly fx: FxService,
    private readonly tierService: PricingTierService,
    private readonly tierWhyService: PricingTierWhyItemService,
    private readonly quickEstimateService: QuickEstimateService,
    private readonly whyChooseService: WhyChooseService,
    private readonly paymentMethodService: PaymentMethodService,
    private readonly revalidate: RevalidateService, //
    @Inject(REDIS) private readonly redisClient?: Redis,
  ) {
    this.cacheTtlSeconds = Number(process.env.PRICING_CACHE_TTL_SECONDS ?? 3600);
    this.cacheVersion = process.env.PRICING_CACHE_VERSION ?? `v1`;
    this.prewarmCurrencies = (process.env.PRICING_PREWARM_CURRENCIES ?? 'KES')
      .split(',')
      .map(s => s.trim().toUpperCase())
      .filter(Boolean);
  }

  private cacheKey(currency: string) {
    return `pricing:page:${currency.toUpperCase()}:${this.cacheVersion}`;
  }

  private async readCacheKey(key: string): Promise<any | null> {
    if (!this.redisClient) return null;
    try {
      const txt = await this.redisClient.get(key);
      return txt ? JSON.parse(txt) : null;
    } catch (e) {
      this.logger.warn(`Redis read failed for ${key}: ${String((e as any)?.message ?? e)}`);
      return null;
    }
  }

  private async writeCacheKey(key: string, payload: any) {
    if (!this.redisClient) return;
    try {
      await this.redisClient.set(key, JSON.stringify(payload), 'EX', this.cacheTtlSeconds);
      this.logger.debug(`Wrote pricing cache ${key} (ttl=${this.cacheTtlSeconds}s)`);
    } catch (e) {
      this.logger.warn(`Redis write failed for ${key}: ${String((e as any)?.message ?? e)}`);
    }
  }

  private async delCacheKey(key: string) {
    if (!this.redisClient) return;
    try {
      await this.redisClient.del(key);
      this.logger.debug(`Deleted pricing cache ${key}`);
    } catch (e) {
      this.logger.warn(`Redis del failed for ${key}: ${String((e as any)?.message ?? e)}`);
    }
  }

  private async invalidateCurrency(currency: string) {
    await this.delCacheKey(this.cacheKey(currency));
  }

  async invalidateCurrencies(currencies: string[]) {
    // ensure uppercase and defaults
    const list = (currencies ?? []).map(c => (c ?? 'USD').toUpperCase());
    await Promise.all(list.map(c => this.invalidateCurrency(c)));
  }

  async bumpCacheVersion() {
    this.cacheVersion = `v${Date.now()}`;
    process.env.PRICING_CACHE_VERSION = this.cacheVersion;
    this.logger.log(`Bumped PRICING_CACHE_VERSION to ${this.cacheVersion}`);
    return this.cacheVersion;
  }

  /**
   * Get pricing page payload for a given currency.
   * Tries currency cache -> canonical USD cache -> DB.
   */
  async getPage(currency = 'USD') {
    currency = (currency || 'USD').toUpperCase();
    const currencyKey = this.cacheKey(currency);

    // try currency-specific cache
    const cached = await this.readCacheKey(currencyKey);
    if (cached) {
      this.logger.debug(`Pricing cache hit for ${currencyKey}`);
      return cached;
    }

    // attempt canonical USD cache
    let canonical: any = null;
    if (currency !== 'USD') {
      canonical = await this.readCacheKey(this.cacheKey('USD'));
      if (canonical) this.logger.debug(`Found canonical USD cache, converting to ${currency}`);
    }

    // load from DB if no canonical
    if (!canonical) {
      const page = await this.prisma.pricingPage.findFirst({
        include: {
          offerings: { include: { whyItems: { orderBy: { order: 'asc' } } }, orderBy: [{ id: 'asc' }] },
          quickEstimates: true,
          whyChooseUs: { orderBy: { order: 'asc' } },
          payments: { orderBy: { order: 'asc' } },
        },
      });

      if (!page) return null;

      page.seo =
        Array.isArray(page.seo) && page.seo.length > 0
          ? page.seo[0]
          : {
              metaTitle: page.title ?? 'Pricing',
              metaDescription: page.description ?? '',
              metaKeywords: page.keywords ?? [],
              canonicalUrl: 'https://letei.com/pricing',
              openGraph: {},
              twitterCard: {},
              localSEO: {},
            };

canonical = {
  currency: 'USD',
  backendCurrency: 'USD',
  conversionRate: 1,
  converted: false,
  ...page,
};

      await this.writeCacheKey(this.cacheKey('USD'), canonical);
    }

    // if USD requested, return canonical
    if (currency === 'USD') return canonical;

    // otherwise convert
    let rate = 1;
    try {
      rate = await this.fx.getRate('USD', currency);
      if (!rate || rate <= 0) throw new Error(`Invalid FX rate USD->${currency}`);
    } catch (e) {
      this.logger.error(`Failed to get FX rate USD->${currency}: ${String((e as any)?.message ?? e)}`);
      throw e;
    }

    const converted = JSON.parse(JSON.stringify(canonical));
converted.currency = currency;
converted.backendCurrency = 'USD';
converted.conversionRate = rate;
converted.converted = true;


    // helper to convert nested objects and arrays with numeric amounts
    const convertNestedAmounts = (offerings: any[], fxRate: number) => {
      offerings.forEach(o => {
        const convertAmount = (c: any) => {
          if (!c || typeof c !== 'object') return c;

          ['minAmount', 'maxAmount'].forEach(key => {
            if (typeof c[key] === 'number') {
              c[`${key}OriginalUsd`] = c[key];
              c[key] = Math.round(c[key] * fxRate);
            } else if (!isNaN(Number(c[key]))) {
              const val = Number(c[key]);
              c[`${key}OriginalUsd`] = val;
              c[key] = Math.round(val * fxRate);
            }
          });

          if (c.recommendedBudgetGuidance) {
            ['minimum', 'recommended'].forEach(key => {
              if (typeof c.recommendedBudgetGuidance[key] === 'number') {
                c.recommendedBudgetGuidance[`${key}OriginalUsd`] = c.recommendedBudgetGuidance[key];
                c.recommendedBudgetGuidance[key] = Math.round(c.recommendedBudgetGuidance[key] * fxRate);
              } else if (!isNaN(Number(c.recommendedBudgetGuidance[key]))) {
                const val = Number(c.recommendedBudgetGuidance[key]);
                c.recommendedBudgetGuidance[`${key}OriginalUsd`] = val;
                c.recommendedBudgetGuidance[key] = Math.round(val * fxRate);
              }
            });
          }

          Object.keys(c).forEach(k => {
            if (['minAmount', 'maxAmount'].includes(k)) return;
            if (typeof c[k] === 'number' && k.toLowerCase().includes('amount')) {
              c[`${k}OriginalUsd`] = c[k];
              c[k] = Math.round(c[k] * fxRate);
            }
          });

          return c;
        };

        if (Array.isArray(o.costBreakdown)) {
          o.costBreakdown = o.costBreakdown.map(convertAmount);
        } else if (o.costBreakdown) {
          o.costBreakdown = convertAmount(o.costBreakdown);
        }

        if (o.recommendedBudgetGuidance && typeof o.recommendedBudgetGuidance === 'object') {
          const r = o.recommendedBudgetGuidance;
          ['minimum', 'recommended'].forEach(key => {
            if (typeof r[key] === 'number') {
              r[`${key}OriginalUsd`] = r[key];
              r[key] = Math.round(r[key] * fxRate);
            } else if (!isNaN(Number(r[key]))) {
              const val = Number(r[key]);
              r[`${key}OriginalUsd`] = val;
              r[key] = Math.round(val * fxRate);
            }
          });
        }

        if (o.paymentMilestones) {
          if (Array.isArray(o.paymentMilestones)) {
            o.paymentMilestones = o.paymentMilestones.map(convertAmount);
          } else {
            o.paymentMilestones = convertAmount(o.paymentMilestones);
          }
        }
      });
    };

    if (Array.isArray(converted.offerings)) {
      converted.offerings = converted.offerings.map(o => {
        const origRange = (o.rangeUsd ?? []).map(Number);
        return { ...o, rangeUsdOriginalUsd: origRange, rangeUsd: origRange.map(v => Math.round(v * rate)) };
      });

      try {
        convertNestedAmounts(converted.offerings, rate);
      } catch (e) {
        this.logger.warn(`Failed to convert nested offering amounts: ${String((e as any)?.message ?? e)}`);
      }
    }

    if (Array.isArray(converted.quickEstimates)) {
      converted.quickEstimates = converted.quickEstimates.map(q => {
        const low = Number(q.low ?? 0);
        const high = Number(q.high ?? 0);
        return { ...q, lowOriginalUsd: low, highOriginalUsd: high, low: Math.round(low * rate), high: Math.round(high * rate) };
      });
    }

    await this.writeCacheKey(currencyKey, converted);
    return converted;
  }

  /** Upsert pricing page and evict caches - orchestrates helper services */
  async upsertPage(data: any) {
    const cleaned: any = {
      title: data.title ?? 'Pricing',
      subtitle: data.subtitle ?? null,
      description: data.description ?? null,
      heroImage: data.heroImage ?? null,
      keywords: Array.isArray(data.keywords) ? data.keywords : [],
      cta: data.cta ?? null,
      seo: data.seo ?? null,
      faq: Array.isArray(data.faq) ? data.faq : [],
      published: data.published ?? false,
    };

    let page = await this.prisma.pricingPage.findFirst();
    if (!page) page = await this.prisma.pricingPage.create({ data: cleaned });
    else page = await this.prisma.pricingPage.update({ where: { id: page.id }, data: cleaned });

    const txOptions = { timeout: Number(process.env.PRISMA_TX_TIMEOUT_MS ?? 10000), maxWait: 5000 };

    await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // remove existing relations
      await tx.pricingTier.deleteMany({ where: { pageId: page.id } });
      await tx.quickEstimate.deleteMany({ where: { pageId: page.id } });
      await tx.whyChooseUsItem.deleteMany({ where: { pageId: page.id } });
      await tx.paymentMethod.deleteMany({ where: { pageId: page.id } });

      // create tiers and nested why items
      for (const t of data.offerings ?? []) {
        const details = t.whyDetails ?? {};

        const createdTier = await this.tierService.createForPage(tx, page.id, {
          ...t,
          estimatedTimelineWeeks: details.estimatedTimelineWeeks ?? t.estimatedTimelineWeeks,
          typicalDeliverables: details.typicalDeliverables ?? t.typicalDeliverables,
          assumptions: details.assumptions ?? t.assumptions,
          exclusions: details.exclusions ?? t.exclusions,
          typicalTeam: details.typicalTeam ?? t.typicalTeam,
          costBreakdown: details.costBreakdown ?? t.costBreakdown,
          paymentMilestones: details.paymentMilestones ?? t.paymentMilestones,
          recommendedBudgetGuidance: details.recommendedBudgetGuidance ?? t.recommendedBudgetGuidance,
          exampleScope: details.exampleScope ?? t.exampleScope,
        });

        if (Array.isArray(t.whyItems) && t.whyItems.length) {
          await this.tierWhyService.createManyForTier(tx, createdTier.id, t.whyItems);
        }
      }

      // create other page-level relations
      await this.quickEstimateService.createManyForPage(tx, page.id, data.quickEstimates ?? []);
      await this.whyChooseService.createManyForPage(tx, page.id, data.whyChooseUs ?? []);
      await this.paymentMethodService.createManyForPage(tx, page.id, data.payments ?? []);
    }, txOptions);

    // fetch full result incl relations
    const result = await this.prisma.pricingPage.findUnique({
      where: { id: page.id },
      include: {
        offerings: { include: { whyItems: { orderBy: { order: 'asc' } } }, orderBy: [{ id: 'asc' }] },
        quickEstimates: true,
        whyChooseUs: { orderBy: { order: 'asc' } },
        payments: { orderBy: { order: 'asc' } },
      },
    });

    // write canonical USD cache & prewarm other currencies
    if (result) {
      try {
        await this.writeCacheKey(this.cacheKey('USD'), { currency: 'USD', conversionRate: 1, converted: false, ...result });
      } catch (e) {
        this.logger.warn(`Failed to write canonical cache after upsert: ${String((e as any)?.message ?? e)}`);
      }

      // prewarm currencies in background
      (async () => {
        await Promise.allSettled(this.prewarmCurrencies.map(async cur => {
          try {
            if (!cur || cur === 'USD') return;
            const rate = await this.fx.getRate('USD', cur);
            if (!rate || rate <= 0) throw new Error(`Invalid FX rate USD->${cur}`);
            const converted = JSON.parse(JSON.stringify(result));
          converted.currency = cur;
converted.backendCurrency = 'USD';
converted.conversionRate = rate;
converted.converted = true;


            if (Array.isArray(converted.offerings)) {
              converted.offerings = converted.offerings.map(o => {
                const origRange = (o.rangeUsd ?? []).map(Number);
                return { ...o, rangeUsdOriginalUsd: origRange, rangeUsd: origRange.map(v => Math.round(v * rate)) };
              });

              try {
                // reuse nested conversion
                const convertNestedAmounts = (offerings: any[], fxRate: number) => {
                  offerings.forEach(o => {
                    const convertAmount = (c: any) => {
                      if (!c || typeof c !== 'object') return c;
                      ['minAmount', 'maxAmount'].forEach(key => {
                        if (typeof c[key] === 'number') {
                          c[`${key}OriginalUsd`] = c[key];
                          c[key] = Math.round(c[key] * fxRate);
                        } else if (!isNaN(Number(c[key]))) {
                          const val = Number(c[key]);
                          c[`${key}OriginalUsd`] = val;
                          c[key] = Math.round(val * fxRate);
                        }
                      });
                      if (c.recommendedBudgetGuidance) {
                        ['minimum', 'recommended'].forEach(key => {
                          if (typeof c.recommendedBudgetGuidance[key] === 'number') {
                            c.recommendedBudgetGuidance[`${key}OriginalUsd`] = c.recommendedBudgetGuidance[key];
                            c.recommendedBudgetGuidance[key] = Math.round(c.recommendedBudgetGuidance[key] * fxRate);
                          } else if (!isNaN(Number(c.recommendedBudgetGuidance[key]))) {
                            const val = Number(c.recommendedBudgetGuidance[key]);
                            c.recommendedBudgetGuidance[`${key}OriginalUsd`] = val;
                            c.recommendedBudgetGuidance[key] = Math.round(val * fxRate);
                          }
                        });
                      }
                      return c;
                    };

                    if (Array.isArray(o.costBreakdown)) o.costBreakdown = o.costBreakdown.map(convertAmount);
                    else if (o.costBreakdown) o.costBreakdown = convertAmount(o.costBreakdown);

                    if (o.recommendedBudgetGuidance && typeof o.recommendedBudgetGuidance === 'object') {
                      const r = o.recommendedBudgetGuidance;
                      ['minimum', 'recommended'].forEach(key => {
                        if (typeof r[key] === 'number') {
                          r[`${key}OriginalUsd`] = r[key];
                          r[key] = Math.round(r[key] * fxRate);
                        } else if (!isNaN(Number(r[key]))) {
                          const val = Number(r[key]);
                          r[`${key}OriginalUsd`] = val;
                          r[key] = Math.round(val * fxRate);
                        }
                      });
                    }
                  });
                };

                convertNestedAmounts(converted.offerings, rate);
              } catch (e) {
                this.logger.warn(`Prewarm nested conversion failed for ${cur}: ${String((e as any)?.message ?? e)}`);
              }
            }

            if (Array.isArray(converted.quickEstimates)) {
              converted.quickEstimates = converted.quickEstimates.map(q => ({
                ...q,
                lowOriginalUsd: Number(q.low ?? 0),
                highOriginalUsd: Number(q.high ?? 0),
                low: Math.round(Number(q.low ?? 0) * rate),
                high: Math.round(Number(q.high ?? 0) * rate),
              }));
            }

            await this.writeCacheKey(this.cacheKey(cur), converted);
          } catch (e) {
            this.logger.warn(`Prewarm failed for currency ${cur}: ${String((e as any)?.message ?? e)}`);
          }
        }));
      })().catch(e => this.logger.warn('Prewarm background task failed: ' + String((e as any)?.message ?? e)));
    }

    // Invalidate other caches explicitly (optional) - ensure we clear any currency-specific cache to force recalc next read
    try {
      await this.invalidateCurrencies(['USD', ...(this.prewarmCurrencies ?? [])]);
    } catch (e) {
      this.logger.warn('Failed to invalidate caches after upsert: ' + String((e as any)?.message ?? e));
    }
await this.revalidate.revalidatePricing();
    return result;
  }

  /** Delete pricing page and evict caches */
  async deletePage() {
    const existing = await this.prisma.pricingPage.findFirst();
    if (!existing) return null;

    await this.prisma.pricingTier.deleteMany({ where: { pageId: existing.id } });
    await this.prisma.quickEstimate.deleteMany({ where: { pageId: existing.id } });
    await this.prisma.whyChooseUsItem.deleteMany({ where: { pageId: existing.id } });
    await this.prisma.paymentMethod.deleteMany({ where: { pageId: existing.id } });

    const deleted = await this.prisma.pricingPage.delete({ where: { id: existing.id } });

    try {
      await this.delCacheKey(this.cacheKey('USD'));
      for (const cur of this.prewarmCurrencies) await this.delCacheKey(this.cacheKey(cur));
    } catch (e) {
      this.logger.warn(`Failed to evict pricing cache after delete: ${String((e as any)?.message ?? e)}`);
    }
await this.revalidate.revalidatePricing();
    return deleted;
  }
}
export default PricingService;
