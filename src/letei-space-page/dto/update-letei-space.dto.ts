// backend/src/letei-space/dto/update-letei-space.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { CreateLeteiSpaceDto } from './create-letei-space.dto';

export class UpdateLeteiSpaceDto extends PartialType(CreateLeteiSpaceDto) {}
