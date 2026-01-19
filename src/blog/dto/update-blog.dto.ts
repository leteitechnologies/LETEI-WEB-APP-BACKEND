// src/blog/dto/UpdateBlogDto.ts
import {
  IsString,
  IsOptional,
  IsArray,
  IsBoolean,
  IsInt,
  ValidateNested,
  IsISO8601,
} from 'class-validator';
import { Type } from 'class-transformer';
import { BlogCtaDto } from './BlogCtaDto';

export class UpdateBlogDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsString()
  excerpt?: string;

  @IsOptional()
  @IsString()
  coverImageId?: string;

    @IsOptional()
  @IsString()
  coverImageUrl?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  imageIds?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  keywords?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsInt()
  readTime?: number;

  @IsOptional()
  @IsBoolean()
  featured?: boolean;

  @IsOptional()
  @IsBoolean()
  draft?: boolean;

  @IsOptional()
  seo?: any;

  @IsOptional()
  meta?: any;

  @IsOptional()
  @IsISO8601()
  publishedAt?: string | null;

  @IsOptional()
  @ValidateNested()
  @Type(() => BlogCtaDto)
  cta?: BlogCtaDto | null;
  
    @IsOptional()
  @IsString()
  authorId?: string | null; 
}
