// src/images/dto/create-asset.dto.ts
import { IsString, IsOptional, IsUrl } from 'class-validator';

export class CreateAssetDto {
  @IsUrl()
  url: string;

  @IsOptional()
  @IsString()
  postId?: string;

  @IsOptional()
  @IsString()
  alt?: string;

  @IsOptional()
  @IsString()
  caption?: string;

  @IsOptional()
  @IsString()
  role?: string; // e.g. "inline" | "cover"
}
