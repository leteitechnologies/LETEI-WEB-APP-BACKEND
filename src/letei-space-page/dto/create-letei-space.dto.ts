// backend/src/letei-space/dto/create-letei-space.dto.ts
import { IsString, IsOptional, IsBoolean, IsNumber, IsObject } from 'class-validator';

export class CreateLeteiSpaceDto {
  @IsString()
  slug: string;

  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  subtitle?: string;

  @IsOptional()
  @IsString()
  description?: string;

  // flexible JSON fields (validated at app-level if needed)
  @IsOptional()
  @IsObject()
  hero?: any;

  @IsOptional()
  @IsObject()
  plans?: any;

  @IsOptional()
  @IsObject()
  integrations?: any;

  @IsOptional()
  @IsObject()
  whyChoose?: any;

  @IsOptional()
  @IsObject()
  faq?: any;

  @IsOptional()
  @IsObject()
  testimonials?: any;

  @IsOptional()
  @IsObject()
  features?: any;

  @IsOptional()
  @IsObject()
  technicalNotes?: any;

  @IsOptional()
  @IsObject()
  trustedMetrics?: any;

  @IsOptional()
  @IsObject()
  cta?: any;

  @IsOptional()
  @IsObject()
  seo?: any;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsNumber()
  conversionRate?: number;

  @IsOptional()
  @IsBoolean()
  published?: boolean;
}
