// src/contact/dto/submit-contact.dto.ts
import { IsBoolean, IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class SubmitContactDto {
  @IsNotEmpty() @IsString() @MaxLength(200)
  name: string;

  @IsNotEmpty() @IsEmail() @MaxLength(200)
  email: string;

  @IsOptional() @IsString() @MaxLength(200)
  org?: string;

  @IsNotEmpty() @IsString() @MaxLength(5000)
  message: string;
    @IsBoolean()
  privacyConsent: boolean;  
}
