// src/blog/blog.module.ts
import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';   // <-- from @nestjs/axios
import { BlogService } from './blog.service';
import { BlogController } from './blog.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { ImagesModule } from 'src/images/images.module';

@Module({
  imports: [
    PrismaModule,
    HttpModule, 
    ImagesModule,
  ],
  providers: [BlogService],
  controllers: [BlogController],
})
export class BlogModule {}
