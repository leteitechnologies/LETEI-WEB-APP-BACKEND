// src/newsletter/dto/create-subscribe.dto.ts
import { IsEmail, IsOptional, IsString, IsBoolean } from 'class-validator';

export class CreateSubscribeDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsEmail()
  email!: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsBoolean()
  privacyConsent?: boolean;
}
