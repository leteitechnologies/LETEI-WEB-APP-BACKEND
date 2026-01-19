import { IsEmail, IsOptional, IsString } from 'class-validator';

export class CreateJobApplicationDto {
  @IsString()
  name!: string;

  @IsEmail()
  email!: string;

  @IsOptional()
  @IsString()
  role?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  cvLink?: string;

  @IsOptional()
  @IsString()
  idempotencyKey?: string;
}
