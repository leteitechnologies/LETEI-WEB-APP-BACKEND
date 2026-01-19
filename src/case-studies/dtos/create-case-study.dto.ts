// src/case-studies/dto/create-case-study.dto.ts
import { IsArray, IsBoolean, IsOptional, IsString, IsISO8601, IsObject } from 'class-validator';

export class CreateCaseStudyDto {
  @IsString()
  slug: string;

  @IsString()
  client: string;

  @IsString()
  sector: string;

  @IsOptional()
  @IsString()
  timeline?: string;

  @IsOptional()
  @IsISO8601()
  startDate?: string;

  @IsOptional()
  @IsISO8601()
  endDate?: string;

  @IsOptional()
  readTime?: number;

  @IsOptional()
  @IsString()
  short?: string;

  @IsString()
  problem: string;

  @IsOptional()
  @IsString()
  approach?: string;

  @IsString()
  solution: string;

  // ✅ enforce array
  @IsOptional()
  @IsArray()
  results?: string[];

  @IsOptional()
  metrics?: any; // keep JSON object flexible

  @IsOptional()
  @IsArray()
  platforms?: string[];

  @IsOptional()
  @IsArray()
  tags?: string[];

  @IsOptional()
  @IsBoolean()
  featured?: boolean;

  @IsOptional()
  quote?: any;

  @IsOptional()
  team?: any;

  @IsOptional()
  @IsArray()
  techStack?: string[];

  @IsOptional()
  resources?: any;

  @IsOptional()
  seo?: any;

  @IsOptional()
  images?: any;

  @IsOptional()
  @IsObject()
  clientLogo?: { src: string; alt: string }; // ✅ added logo

  @IsOptional()
  @IsISO8601()
  publishedAt?: string;

  @IsOptional()
  @IsBoolean()
  draft?: boolean;
}

