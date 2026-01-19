import { Injectable, Logger, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FxService } from '../fx-rates/fx.service';
import Redis from 'ioredis';
import { REDIS } from '../common/redis/redis.provider'; // same token used elsewhere

@Injectable()
export class LeteiSpaceService {
  private readonly logger = new Logger(LeteiSpaceService.name);
  private readonly cacheTtlSeconds: number;
  private cacheVersion: string;
  private prewarmCurrencies: string[];

  constructor(
    private readonly prisma: PrismaService,
    private readonly fx: FxService,
    @Inject(REDIS) private readonly redis?: Redis,
  ) {
    this.cacheTtlSeconds = Number(process.env.LETEI_CACHE_TTL_SECONDS ?? process.env.PRICING_CACHE_TTL_SECONDS ?? 3600);
    this.cacheVersion = process.env.LETEI_CACHE_VERSION ?? process.env.PRICING_CACHE_VERSION ?? `v1`;
    this.prewarmCurrencies = (process.env.LETEI_PREWARM_CURRENCIES ?? process.env.PRICING_PREWARM_CURRENCIES ?? 'KES')
      .split(',')
      .map(s => s.trim().toUpperCase())
      .filter(Boolean);
  }

  private cacheKey(slug: string, currency: string) {
    return `letei-space:${slug}:${currency.toUpperCase()}:${this.cacheVersion}`;
  }

  private async readCacheKey(key: string): Promise<any | null> {
    if (!this.redis) return null;
    try {
      const txt = await this.redis.get(key);
      return txt ? JSON.parse(txt) : null;
    } catch (e) {
      this.logger.warn(`Redis read failed for ${key}: ${String((e as any)?.message ?? e)}`);
      return null;
    }
  }

  private async writeCacheKey(key: string, payload: any) {
    if (!this.redis) return;
    try {
      await this.redis.set(key, JSON.stringify(payload), 'EX', this.cacheTtlSeconds);
      this.logger.debug(`Wrote letei cache ${key} (ttl=${this.cacheTtlSeconds}s)`);
    } catch (e) {
      this.logger.warn(`Redis write failed for ${key}: ${String((e as any)?.message ?? e)}`);
    }
  }

  private async delCacheKey(key: string) {
    if (!this.redis) return;
    try {
      await this.redis.del(key);
      this.logger.debug(`Deleted letei cache ${key}`);
    } catch (e) {
      this.logger.warn(`Redis del failed for ${key}: ${String((e as any)?.message ?? e)}`);
    }
  }

  async invalidateCurrencies(slug: string, currencies: string[]) {
    const normalized = (currencies ?? []).map(c => (c ?? 'USD').toUpperCase());
    await Promise.all(normalized.map(c => this.delCacheKey(this.cacheKey(slug, c))));
  }

  async bumpCacheVersion() {
    this.cacheVersion = `v${Date.now()}`;
    process.env.LETEI_CACHE_VERSION = this.cacheVersion;
    this.logger.log(`Bumped LETEI_CACHE_VERSION to ${this.cacheVersion}`);
    return this.cacheVersion;
  }

  /**
   * Get letei-space page by slug, with currency conversion + caching.
   * Behavior:
   *  - try currency-specific cache
   *  - if not found, try canonical USD cache
   *  - if canonical missing, load from DB, write canonical cache
   *  - if requested != USD: convert canonical to requested using FxService and cache converted payload
   */
  async getPage(slug: string, currency = 'USD') {
    slug = String(slug ?? '').trim();
    if (!slug) return null;
    currency = (currency || 'USD').toUpperCase();

    const currencyKey = this.cacheKey(slug, currency);

    // 1) try currency-specific cache
    const cached = await this.readCacheKey(currencyKey);
    if (cached) {
      this.logger.debug(`Letei cache hit for ${currencyKey}`);
      return cached;
    }

    // 2) try canonical USD cache
    let canonical: any = null;
    if (currency !== 'USD') {
      canonical = await this.readCacheKey(this.cacheKey(slug, 'USD'));
      if (canonical) this.logger.debug(`Found canonical USD cache for ${slug}, converting to ${currency}`);
    }

    // 3) load from DB if no canonical
    if (!canonical) {
      // adjust depending on your prisma model name
      // try to fetch by slug
      const page = await this.prisma.leteiSpacePage?.findUnique?.({
        where: { slug },
      }) ?? await this.prisma.leteiOnePage?.findUnique?.({ where: { slug } });

      if (!page) return null;

      // normalize JSON fields that might be stored as JSON/strings in DB
      const normalized = { ...page };
      ['features', 'plans', 'integrations', 'useCases', 'faq', 'metrics', 'testimonials', 'technicalNotes', 'trustedMetrics'].forEach(k => {
        if (typeof (normalized as any)[k] === 'string') {
          try { (normalized as any)[k] = JSON.parse((normalized as any)[k]); } catch { /* noop */ }
        }
      });

      canonical = { currency: 'USD', conversionRate: 1, converted: false, ...normalized };

      // write canonical USD cache
      try {
        await this.writeCacheKey(this.cacheKey(slug, 'USD'), canonical);
      } catch (e) {
        this.logger.warn(`Failed to write canonical cache for letei ${slug}: ${String((e as any)?.message ?? e)}`);
      }
    }

    // if requested is USD, return canonical
    if (currency === 'USD') return canonical;

    // otherwise convert numeric amounts
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
    converted.conversionRate = rate;
    converted.converted = true;

    // Convert known numeric places:
    // - plans[].priceAmount (string in some shapes) -> priceAmountNumber & converted price
    // - trustedMetrics.values (numbers)
    // - other nested numeric fields if present (attempt best-effort)
    try {
      if (Array.isArray(converted.plans)) {
        converted.plans = converted.plans.map((p: any) => {
          const copy = { ...p };
          // priceAmount could be string like "1000" or "1,200" or numeric
          const num = Number(String(copy.priceAmount ?? copy.price ?? copy.priceAmountUsd ?? 0).replace(/[^0-9.-]+/g, '')) || 0;
          copy.priceAmountOriginalUsd = num;
          copy.priceAmountNumber = Math.round(num * rate);
          // also set priceSuffix if missing
          if (!copy.priceSuffix && converted.currency) copy.priceSuffix = converted.currency;
          return copy;
        });
      }

      if (Array.isArray(converted.trustedMetrics)) {
        converted.trustedMetrics = converted.trustedMetrics.map((m: any) => {
          const cpy = { ...m };
          if (typeof cpy.value === 'number') {
            cpy.valueOriginalUsd = cpy.value;
            cpy.value = Math.round(cpy.value * rate);
          } else if (!isNaN(Number(cpy.value))) {
            const v = Number(cpy.value);
            cpy.valueOriginalUsd = v;
            cpy.value = Math.round(v * rate);
          }
          return cpy;
        });
      }

      // try to convert nested numeric fields on features/plans if any cost like keys exist
      const tryConvertNested = (obj: any) => {
        if (!obj || typeof obj !== 'object') return;
        for (const k of Object.keys(obj)) {
          const v = obj[k];
          if (typeof v === 'number' && k.toLowerCase().includes('amount')) {
            obj[`${k}OriginalUsd`] = v;
            obj[k] = Math.round(v * rate);
          } else if (typeof v === 'object') {
            tryConvertNested(v);
          }
        }
      };

      if (Array.isArray(converted.features)) converted.features.forEach(tryConvertNested);
      if (Array.isArray(converted.plans)) converted.plans.forEach(tryConvertNested);
    } catch (e) {
      this.logger.warn(`Failed to convert nested amounts for letei ${slug}: ${String((e as any)?.message ?? e)}`);
    }

    // write converted cache
    await this.writeCacheKey(currencyKey, converted) ;

    return converted;
  }

  /** Upsert page and prewarm caches */
async upsertPage(slug: string, data: any) {
  if (!slug) throw new Error('Missing slug');

  // sanitize/populate payload for DB write (keep original mapping)
  const toSave: any = {
    slug,
    title: data.title ?? 'Letei Space',
    description: data.description ?? null,
    subtitle: data.subtitle ?? null,
    image: data.image ?? null,
    keywords: Array.isArray(data.keywords) ? data.keywords : (data.keywords ? [String(data.keywords)] : []),
    features: data.features ?? null,
    plans: data.plans ?? data.offerings ?? null,
    integrations: data.integrations ?? null,
    useCases: data.useCases ?? null,
    faq: data.faq ?? null,
    metrics: data.metrics ?? null,
    testimonials: data.testimonials ?? null,
    technicalNotes: data.technicalNotes ?? null,
    trustedMetrics: data.trustedMetrics ?? null,
    cta: data.cta ?? null,
    seo: data.seo ?? null,
    currency: data.currency ?? null,
    conversionRate: data.conversionRate ?? null,
    published: data.published ?? false,
    publishedAt: data.published ? new Date() : null,
  };

  // detect which model exists
  const useSpaceModel = !!this.prisma.leteiSpacePage;
  const useOneModel = !!this.prisma.leteiOnePage;

  // allowed keys per model (mirror your prisma schema)
  const allowedSpaceFields = [
    'slug','title','subtitle','description','hero','plans','integrations','whyChoose',
    'faq','testimonials','features','technicalNotes','trustedMetrics','cta','seo',
    'currency','conversionRate','published','publishedAt','createdAt','updatedAt'
  ];

  const allowedOneFields = [
    'slug','title','description','url','image','keywords','features','integrations',
    'useCases','faq','metrics','createdAt','updatedAt','protected'
  ];

  const pick = (obj: any, keys: string[]) => {
    const out: any = {};
    for (const k of keys) {
      if (Object.prototype.hasOwnProperty.call(obj, k) && (obj as any)[k] !== undefined) {
        out[k] = (obj as any)[k];
      }
    }
    return out;
  };

  // find existing record (try both models)
  let existing = await this.prisma.leteiSpacePage?.findUnique?.({ where: { slug } })
    ?? await this.prisma.leteiOnePage?.findUnique?.({ where: { slug } });

  if (!existing) {
    // create
    if (useSpaceModel) {
      const dataToCreate = pick(toSave, allowedSpaceFields);
      const created = await this.prisma.leteiSpacePage.create({ data: dataToCreate });
      existing = created;
    } else if (useOneModel) {
      const dataToCreate = pick(toSave, allowedOneFields);
      // Note: adjust types if your LeteiOnePage expects some fields differently
      const created = await this.prisma.leteiOnePage.create({ data: dataToCreate });
      existing = created;
    } else {
      throw new Error('No suitable Prisma model found for Letei page');
    }
  } else {
    // update
    if (useSpaceModel && this.prisma.leteiSpacePage) {
      const dataToUpdate = pick(toSave, allowedSpaceFields);
      const updated = await this.prisma.leteiSpacePage.update({ where: { id: (existing as any).id }, data: dataToUpdate });
      existing = updated;
    } else if (useOneModel && this.prisma.leteiOnePage) {
      const dataToUpdate = pick(toSave, allowedOneFields);
      const updated = await this.prisma.leteiOnePage.update({ where: { id: (existing as any).id }, data: dataToUpdate });
      existing = updated;
    } else {
      throw new Error('Unable to update existing Letei page: model mismatch');
    }
  }

  // write canonical USD cache
  try {
    const canonical = { currency: 'USD', conversionRate: 1, converted: false, ...existing };
    await this.writeCacheKey(this.cacheKey(slug, 'USD'), canonical);
  } catch (e) {
    this.logger.warn(`Failed to write canonical cache during upsert for ${slug}: ${String((e as any)?.message ?? e)}`);
  }

  // prewarm configured currencies in background (unchanged)
  (async () => {
    await Promise.allSettled(this.prewarmCurrencies.map(async cur => {
      try {
        if (!cur || cur === 'USD') return;
        const rate = await this.fx.getRate('USD', cur);
        if (!rate || rate <= 0) throw new Error(`Invalid FX rate USD->${cur}`);
        const converted = JSON.parse(JSON.stringify(existing));
        converted.currency = cur;
        converted.conversionRate = rate;
        converted.converted = true;
        if (Array.isArray(converted.plans)) {
          converted.plans = converted.plans.map((p: any) => {
            const num = Number(String(p.priceAmount ?? p.price ?? 0).replace(/[^0-9.-]+/g, '')) || 0;
            p.priceAmountOriginalUsd = num;
            p.priceAmountNumber = Math.round(num * rate);
            return p;
          });
        }
        if (Array.isArray(converted.trustedMetrics)) {
          converted.trustedMetrics = converted.trustedMetrics.map((m: any) => {
            if (typeof m.value === 'number') { m.valueOriginalUsd = m.value; m.value = Math.round(m.value * rate); }
            return m;
          });
        }
        await this.writeCacheKey(this.cacheKey(slug, cur), converted);
      } catch (e) {
        this.logger.warn(`Prewarm failed for currency ${cur} (letei ${slug}): ${String((e as any)?.message ?? e)}`);
      }
    }));
  })().catch(e => this.logger.warn('Prewarm background task failed: ' + String((e as any)?.message ?? e)));

  // evict other caches explicitly to force fresh next reads
  try {
    await this.invalidateCurrencies(slug, ['USD', ...this.prewarmCurrencies]);
  } catch (e) {
    this.logger.warn('Failed to invalidate caches after upsert: ' + String((e as any)?.message ?? e));
  }

  return existing;
}

  async deletePage(slug: string) {
    const page = await this.prisma.leteiSpacePage?.findUnique?.({ where: { slug } }) ?? await this.prisma.leteiOnePage?.findUnique?.({ where: { slug } });
    if (!page) return null;

    // delete whichever model exists (be conservative)
    if (this.prisma.leteiSpacePage) {
      await this.prisma.leteiSpacePage.delete({ where: { id: page.id } });
    } else if (this.prisma.leteiOnePage) {
      await this.prisma.leteiOnePage.delete({ where: { id: page.id } });
    }

    // evict caches
    try {
      await this.delCacheKey(this.cacheKey(slug, 'USD'));
      for (const cur of this.prewarmCurrencies) await this.delCacheKey(this.cacheKey(slug, cur));
    } catch (e) {
      this.logger.warn(`Failed to evict letei caches after delete: ${String((e as any)?.message ?? e)}`);
    }

    return page;
  }
}
export default LeteiSpaceService;
