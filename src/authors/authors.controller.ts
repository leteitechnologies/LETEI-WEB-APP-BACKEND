import { Controller, Get, Post, Put, Delete, Param, Body, Query } from '@nestjs/common';
import { AuthorsService } from './authors.service';
import { CreateAuthorDto } from './dto/create-author.dto';
import { UpdateAuthorDto } from './dto/update-author.dto';

@Controller('authors')
export class AuthorsController {
  constructor(private svc: AuthorsService) {}

  @Get()
  async list(@Query('q') q?: string) {
    return this.svc.findAll(q);
  }

  @Post()
  async create(@Body() body: CreateAuthorDto) {
    return this.svc.create(body);
  }

  @Get(':id')
  async get(@Param('id') id: string) {
    return this.svc.findOne(id);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: UpdateAuthorDto) {
    return this.svc.update(id, body);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.svc.remove(id);
  }
}
