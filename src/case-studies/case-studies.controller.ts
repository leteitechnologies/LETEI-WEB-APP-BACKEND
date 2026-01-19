// src/case-studies/case-studies.controller.ts
import { Controller, Get, Post, Put, Delete, Param, Body, NotFoundException, UsePipes, ValidationPipe } from '@nestjs/common';
import { CaseStudiesService } from './case-studies.service';
import { CreateCaseStudyDto } from './dtos/create-case-study.dto';
import { UpdateCaseStudyDto } from './dtos/update-case-study.dto';

@Controller('case-studies')
export class CaseStudiesController {
  constructor(private readonly svc: CaseStudiesService) {}

@Get()
async list() {
  const items = await this.svc.findAll();
  return { ok: true, data: items };
}

@Get(':id')
async get(@Param('id') id: string) {
  const cs = await this.svc.findOne(id);
  if (!cs) throw new NotFoundException('Case study not found');
  return { ok: true, data: cs };
}


  @Post()
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  create(@Body() dto: CreateCaseStudyDto) {
    return this.svc.create(dto);
  }

  @Put(':id')
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  update(@Param('id') id: string, @Body() dto: UpdateCaseStudyDto) {
    return this.svc.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.svc.remove(id);
  }
}
