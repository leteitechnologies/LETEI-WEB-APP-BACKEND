// src/images/dto/AttachAssetsDto.ts
import { IsArray, IsString } from 'class-validator';

export class AttachAssetsDto {
  @IsArray()
  @IsString({ each: true })
  assetIds: string[];
}
