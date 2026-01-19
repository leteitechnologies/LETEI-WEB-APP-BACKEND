// src/case-studies/case-studies.module.ts
import { Module } from '@nestjs/common';
import { CaseStudiesService } from './case-studies.service';
import { CaseStudiesController } from './case-studies.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [CaseStudiesService],
  controllers: [CaseStudiesController],
})
export class CaseStudiesModule {}
