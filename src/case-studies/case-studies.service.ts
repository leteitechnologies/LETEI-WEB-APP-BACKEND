// src/case-studies/case-studies.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCaseStudyDto } from './dtos/create-case-study.dto';
import { UpdateCaseStudyDto } from './dtos/update-case-study.dto';
import { slugify } from 'src/utils/slugify';

@Injectable()
@Injectable()
export class CaseStudiesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    const items = await this.prisma.caseStudy.findMany({
      orderBy: { publishedAt: 'desc' },
    });
    return items.map(this.normalize);
  }

  async findOne(idOrSlug: string) {
    const item = await this.prisma.caseStudy.findFirst({
      where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }] },
    });
    return item ? this.normalize(item) : null;
  }

create(dto: CreateCaseStudyDto) {
  if (!dto.slug && dto.client) {
    dto.slug = slugify(dto.client);
  }
  return this.prisma.caseStudy.create({ data: dto as any });
}
update(id: string, dto: UpdateCaseStudyDto) {
  if (dto.client && !dto.slug) {
    dto.slug = slugify(dto.client);
  }
  return this.prisma.caseStudy.update({
    where: { id },
    data: dto as any,
  });
}


  remove(id: string) {
    return this.prisma.caseStudy.delete({ where: { id } });
  }



private normalize(cs: any) {
  // Handle hero array -> single object
  const hero =
    Array.isArray(cs.hero) && cs.hero.length > 0
      ? cs.hero[0]
      : Array.isArray(cs.images) && cs.images.length > 0
      ? cs.images[0]
      : cs.hero ?? cs.images ?? null;

  return {
    ...cs,
    hero,
    slug: cs.slug ?? cs.client ? slugify(cs.client) : undefined,
    results: cs.results ?? [],
    metrics: cs.metrics ?? [],
    platforms: cs.platforms ?? [],
    tags: cs.tags ?? [],
    techStack: cs.techStack ?? [],
    resources: cs.resources ?? [],
    team: cs.team ?? [],
    images: cs.images ?? null,   
  };
}


}

