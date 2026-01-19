// src/images/dto/create-asset-from-url.dto.ts
import { IsString, IsOptional, IsUrl } from 'class-validator';

export class CreateAssetFromUrlDto {
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
  role?: string;    // e.g. "inline" | "cover"

  @IsOptional()
  @IsString()
  key?: string;     // optional Cloudinary public_id if client provides it

  @IsOptional()
  width?: number;

  @IsOptional()
  height?: number;
}
