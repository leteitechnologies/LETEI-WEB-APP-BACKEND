import { IsString, IsOptional, IsUrl } from "class-validator";

export class CreateClientDto {
  @IsString()
  name!: string;

  // logoUrl is optional if you accept multipart upload separately
  @IsOptional()
  @IsUrl()
  logoUrl?: string;
}
