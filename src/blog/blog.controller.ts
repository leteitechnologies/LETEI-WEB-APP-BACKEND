import { Controller, Get, Post, Put, Delete, Param, Body, Query, NotFoundException } from '@nestjs/common';
import { BlogService } from './blog.service';
import { CreateBlogDto } from './dto/create-blog.dto';
import { UpdateBlogDto } from './dto/update-blog.dto';

@Controller('blogs')
export class BlogController {
  constructor(private readonly svc: BlogService) {}

@Get()
async list(
  @Query('page') page?: string,
  @Query('perPage') perPage?: string,
  @Query('tag') tag?: string,
  @Query('q') q?: string,
  @Query('featured') featured?: string,
  @Query('authorId') authorId?: string,
) {
  const p = parseInt(page ?? '1', 10);
  const pp = parseInt(perPage ?? '10', 10);
  const isFeatured = featured === 'true' ? true : featured === 'false' ? false : undefined;
  return this.svc.findMany({ page: p, perPage: pp, tag, q, featured: isFeatured, authorId });
}

  @Get('slug/:slug')
  async getBySlug(@Param('slug') slug: string, @Query('preview') preview?: string) {
    const post = await this.svc.findBySlug(decodeURIComponent(slug), preview === 'true');
    if (!post) throw new NotFoundException(`Blog post not found for slug: ${slug}`);
    return post;
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    const post = await this.svc.findById(id, true);
    if (!post) throw new NotFoundException(`Blog post not found by id: ${id}`);
    return post;
  }

  @Post()
  async create(@Body() body: CreateBlogDto) { return this.svc.create(body); }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: UpdateBlogDto) { return this.svc.update(id, body); }

  @Delete(':id')
  async remove(@Param('id') id: string) { return this.svc.delete(id); }

  @Post(':id/publish')
  async publish(@Param('id') id: string) { return this.svc.publish(id); }
}
