import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAuthorDto } from './dto/create-author.dto';
import { UpdateAuthorDto } from './dto/update-author.dto';
import { Prisma } from '@prisma/client';
@Injectable()
export class AuthorsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateAuthorDto) {
    return this.prisma.author.create({ data: dto });
  }



async findAll(q?: string) {
  const where = q
    ? {
        OR: [
          { name: { contains: q, mode: Prisma.QueryMode.insensitive } },
          { bio: { contains: q, mode: Prisma.QueryMode.insensitive } },
          { slug: { contains: q, mode: Prisma.QueryMode.insensitive } },
        ],
      }
    : {};

  return this.prisma.author.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });
}


  async findOne(idOrSlug: string) {
    const author = idOrSlug.length === 36 || idOrSlug.length === 25 ? // naive id length heuristic
      await this.prisma.author.findUnique({ where: { id: idOrSlug } }) :
      await this.prisma.author.findUnique({ where: { slug: idOrSlug } });
    if (!author) throw new NotFoundException('Author not found');
    return author;
  }

  async update(id: string, dto: UpdateAuthorDto) {
    return this.prisma.author.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    return this.prisma.author.delete({ where: { id } });
  }
}
