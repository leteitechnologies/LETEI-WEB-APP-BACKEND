// backend/src/letei-one-page/dto/create-letei-one-page.dto.ts
import { IsArray, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateLeteiOneDto {
  @IsString()
  @IsNotEmpty()
  slug!: string;

  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsNotEmpty()
  description!: string;   // ✅ now required

  @IsString()
  @IsOptional()
  url?: string;

  @IsString()
  @IsOptional()
  image?: string;

  @IsArray()
  @IsOptional()
  keywords?: string[];

  @IsArray()
  @IsOptional()
  integrations?: string[];

  @IsOptional()
  features?: any;

  @IsOptional()
  useCases?: any;

  @IsOptional()
  faq?: any;

  @IsOptional()
  metrics?: any;
}
