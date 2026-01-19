// backend/src/letei-one-page/LeteiOnePage.service.ts
import { Injectable, Logger, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateLeteiOneDto } from "./dto/create-letei-one.dto";
import { UpdateLeteiOneDto } from "./dto/update-letei-one.dto";


@Injectable()
export class LeteiOnePageService {
  private readonly logger = new Logger(LeteiOnePageService.name);
  private readonly nextUrl = process.env.NEXT_APP_URL;
  private readonly revalidateSecret = process.env.REVALIDATE_SECRET;

  constructor(private readonly prisma: PrismaService) {}

  // Keep returns as Promises — Prisma returns promises synchronously
  findAll() {
    // model ProductPage -> prisma.leteiOnePage
    return this.prisma.leteiOnePage.findMany({ orderBy: { updatedAt: "desc" } });
  }

  findOne(slug: string) {
    return this.prisma.leteiOnePage.findUnique({ where: { slug } });
  }

  async create(dto: CreateLeteiOneDto) {
    const created = await this.prisma.leteiOnePage.create({ data: dto as any });
    // attempt revalidate (do not fail create if revalidate fails)
    this.requestRevalidate(created.slug).catch((err) =>
      this.logger.warn(`Revalidate request failed after create for ${created.slug}: ${err?.message ?? err}`)
    );
    return created;
  }

async update(slug: string, dto: UpdateLeteiOneDto) {
  // Check if page exists
  const existing = await this.prisma.leteiOnePage.findUnique({ where: { slug } });

  if (existing) {
        const updateData: any = {};

    // helper: merge arrays by "id" (update existing items by id, append new ones)
    const mergeArrayById = (existingArr: any[] | null | undefined, incomingArr: any[] | undefined) => {
      if (incomingArr === undefined) return undefined; // caller uses !== undefined to decide whether to touch field
      const base: any[] = Array.isArray(existingArr) ? existingArr.slice() : [];

      // index existing items by id for quick lookup
      const existingById = new Map<string, any>();
      base.forEach((it) => {
        if (it && it.id) existingById.set(String(it.id), it);
      });

      // updated list: start with existing items (we'll patch them) to preserve order
      const patched = base.map((it) => ({ ...it }));

      // For each incoming item: if it matches an existing id -> merge into patched; otherwise append
      for (const inc of (incomingArr || [])) {
        if (inc && inc.id && existingById.has(String(inc.id))) {
          // find index in patched
          const idx = patched.findIndex((p) => p && p.id && String(p.id) === String(inc.id));
          if (idx !== -1) {
            patched[idx] = { ...patched[idx], ...inc };
            continue;
          }
        }
        // no id match — append as new
        patched.push(inc);
      }

      return patched;
    };
 

    // only assign if explicitly present in dto
    if (dto.title !== undefined) updateData.title = dto.title;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.image !== undefined) updateData.image = dto.image;
    if (dto.url !== undefined) updateData.url = dto.url;

    // arrays / json fields
    if (dto.keywords !== undefined) updateData.keywords = dto.keywords;
    if (dto.integrations !== undefined) updateData.integrations = dto.integrations;
    if (dto.features !== undefined) updateData.features = mergeArrayById(Array.isArray(existing.features) ? existing.features : [], dto.features);
    if (dto.useCases !== undefined) updateData.useCases = mergeArrayById(Array.isArray(existing.useCases) ? existing.useCases : [], dto.useCases);
    if (dto.faq !== undefined) updateData.faq = mergeArrayById(Array.isArray(existing.faq) ? existing.faq : [], dto.faq);
    if (dto.metrics !== undefined) updateData.metrics = dto.metrics;

    const updated = await this.prisma.leteiOnePage.update({
      where: { slug },
      data: updateData,
    });

    // revalidate (do not fail update if revalidate fails)
    this.requestRevalidate(slug).catch((err) =>
      this.logger.warn(
        `Revalidate request failed after update for ${slug}: ${
          err?.message ?? err
        }`,
      ),
    );
    return updated;
  }

  // Not found -> creating; enforce description for create
  if (
    !dto.description ||
    (typeof dto.description === "string" && dto.description.trim().length === 0)
  ) {
    throw new BadRequestException(
      "description is required when creating a leteiOnePage page",
    );
  }

  const created = await this.prisma.leteiOnePage.create({
    data: {
      slug,
      title: dto.title ?? slug,
      description: dto.description,
      keywords: dto.keywords ?? [],
      integrations: dto.integrations ?? [],
      features: dto.features ?? null,
      useCases: dto.useCases ?? null,
      faq: dto.faq ?? null,
      metrics: dto.metrics ?? {},
      image: dto.image ?? null,
      url: dto.url ?? null,
    },
  });

  this.requestRevalidate(slug).catch((err) =>
    this.logger.warn(
      `Revalidate request failed after create for ${slug}: ${
        err?.message ?? err
      }`,
    ),
  );
  return created;
}


async remove(slug: string) {
  const leteiOnePage = await this.prisma.leteiOnePage.findUnique({ where: { slug } });
  if (!leteiOnePage) throw new BadRequestException("Not found");

  if (leteiOnePage.protected) {
    throw new BadRequestException("This leteiOnePage cannot be deleted until unprotected");
  }

  return this.prisma.leteiOnePage.delete({ where: { slug } });
}

  /**
   * Call Next.js revalidate API server-to-server.
   * Does nothing if NEXT_APP_URL is not configured.
   */
  private async requestRevalidate(slug: string) {
    if (!this.nextUrl) {
      this.logger.debug("NEXT_APP_URL not configured; skipping revalidate call");
      return;
    }

    const endpoint = `${this.nextUrl.replace(/\/$/, "")}/api/revalidate`;
    const payload: any = { slug };

    if (this.revalidateSecret) payload.secret = this.revalidateSecret;

    // Use global fetch if available (Node 18+). If you run older Node, install axios or node-fetch.
    const body = JSON.stringify(payload);

    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const hasFetch = typeof (global as any).fetch === "function";
      if (hasFetch) {
        const res = await (global as any).fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body,
        });
        if (!res.ok) {
          const text = await res.text().catch(() => "");
          throw new Error(`Revalidate responded ${res.status}: ${text}`);
        }
        this.logger.log(`Revalidate requested for /leteiOnePage/${slug}`);
      } else {
        // Fallback to axios (ensure axios is installed) — this block only runs if global fetch missing
        // npm i axios
        const axios = require("axios");
        const res = await axios.post(endpoint, payload, { headers: { "Content-Type": "application/json" } });
        if (res.status < 200 || res.status >= 300) {
          throw new Error(`Revalidate responded ${res.status}`);
        }
        this.logger.log(`Revalidate requested for /leteiOnePage/${slug} (via axios)`);
      }
    } catch (err) {
      // bubble up so callers can log, but do not throw from update/create
      throw err;
    }
  }
  async setProtected(slug: string, value: boolean) {
  const existing = await this.prisma.leteiOnePage.findUnique({ where: { slug } });
  if (!existing) throw new BadRequestException("Product not found");

  return this.prisma.leteiOnePage.update({
    where: { slug },
    data: { protected: value },
  });
}

}
