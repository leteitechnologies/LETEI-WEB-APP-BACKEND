// src/blog/dto/BlogCtaDto.ts
import { IsString, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class BlogCtaButtonDto {
  @IsString()
  label: string;

  @IsString()
  url: string;
}

export class BlogCtaDto {
  @IsString()
  headline: string;

  @IsOptional()
  @IsString()
  subtext?: string;

  @ValidateNested()
  @Type(() => BlogCtaButtonDto)
  button: BlogCtaButtonDto;
}
