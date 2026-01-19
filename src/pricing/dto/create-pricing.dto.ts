import {
  IsString,
  IsOptional,
  IsBoolean,
  IsArray,
  IsObject,
  ValidateNested,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';

export class PricingWhyItemDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsOptional()
  @IsString()
  icon?: string;

  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string | null;

  @IsOptional()
  @IsNumber()
  order?: number;

  // NOTE: structured fields were removed from the WhyItem DTO.
  // Structured fields now belong to the OfferingDto (i.e. stored on the PricingTier).
}

export class OfferingDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  tagline?: string;

  @IsOptional()
  @IsArray()
  taglineParts?: string[];

  @IsOptional()
  @IsArray()
  rangeUsd?: number[]; // [low, high]

  @IsOptional()
  @IsArray()
  bullets?: string[];

  @IsOptional()
  @IsBoolean()
  highlight?: boolean;

  // Structured fields now live on the offering (PricingTier)
  @IsOptional()
  @IsArray()
  estimatedTimelineWeeks?: number[]; // [minWeeks, maxWeeks]

  @IsOptional()
  @IsObject()
  typicalTeam?: any;

  @IsOptional()
  @IsArray()
  typicalDeliverables?: string[];

  @IsOptional()
  @IsObject()
  costBreakdown?: any;

  @IsOptional()
  @IsArray()
  assumptions?: string[];

  @IsOptional()
  @IsArray()
  exclusions?: string[];

  @IsOptional()
  @IsObject()
  paymentMilestones?: any;

  @IsOptional()
  @IsObject()
  recommendedBudgetGuidance?: any;

  @IsOptional()
  @IsString()
  exampleScope?: string;

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => PricingWhyItemDto)
  @IsArray()
  whyItems?: PricingWhyItemDto[];
}

export class QuickEstimateDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsString()
  label!: string;

  @IsNumber()
  low!: number;

  @IsNumber()
  high!: number;

  @IsOptional()
  @IsString()
  note?: string;
}

class FaqItemDto {
  @IsString()
  question!: string;

  @IsString()
  answer!: string;
}

export class WhyChooseUsDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsOptional()
  @IsString()
  icon?: string;

  @IsString()
  title!: string;

  @IsString()
  description!: string;

  @IsOptional()
  @IsNumber()
  order?: number;
}

export class PaymentMethodDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsString()
  label!: string;

  @IsOptional()
  @IsString()
  logoSrc?: string;

  @IsOptional()
  @IsNumber()
  order?: number;
}

export class CreatePricingDto {
@IsOptional()
@IsString()
title?: string;


  @IsOptional()
  @IsString()
  subtitle?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  heroImage?: string;

  @IsOptional()
  @IsArray()
  keywords?: string[];

  @IsOptional()
  @IsObject()
  features?: any;

  @IsOptional()
  @IsObject()
  cta?: any;

  @IsOptional()
  @IsObject()
  seo?: any;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FaqItemDto)
  faq?: FaqItemDto[];

  @IsOptional()
  @IsBoolean()
  published?: boolean;

  // New arrays
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => OfferingDto)
  @IsArray()
  offerings?: OfferingDto[];

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => QuickEstimateDto)
  @IsArray()
  quickEstimates?: QuickEstimateDto[];

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => WhyChooseUsDto)
  @IsArray()
  whyChooseUs?: WhyChooseUsDto[];

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => PaymentMethodDto)
  @IsArray()
  payments?: PaymentMethodDto[];
}
