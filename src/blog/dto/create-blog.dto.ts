// src/blog/dto/CreateBlogDto.ts
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

export class CreateBlogDto {
  @IsString()
  title: string;

  @IsString()
  content: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsString()
  excerpt?: string;

  // Asset id for single cover image (asset-first model)
  @IsOptional()
  @IsString()
  coverImageId?: string;

    @IsOptional()
  @IsString()
  coverImageUrl?: string;
  // Array of asset ids attached to this post (order matters)
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

  // Optional scheduled publish date (ISO string)
  @IsOptional()
  @IsISO8601()
  publishedAt?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => BlogCtaDto)
  cta?: BlogCtaDto;
  
    @IsOptional()
  @IsString()
  authorId?: string;

}
