// src/book-pilot/dto/create-book-pilot.dto.ts
import { IsEmail, IsOptional, IsString, IsBoolean, Length } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateBookPilotDto {
  @IsString()
  @Transform(({ value }) => String(value ?? '').trim())
  @Length(2, 200)
  name!: string;

  @IsEmail()
  @Transform(({ value }) => String(value ?? '').trim().toLowerCase())
  email!: string;

  @IsString()
  @Transform(({ value }) => String(value ?? '').trim())
  @Length(1, 200)
  company!: string;

  @IsOptional()
  @IsBoolean()
  privacyConsent?: boolean;
}
