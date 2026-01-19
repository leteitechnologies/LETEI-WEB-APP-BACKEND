// backend/src/letei-one-page/dto/update-letei-one-page.dto.ts
import { PartialType } from "@nestjs/mapped-types";
import { CreateLeteiOneDto } from "./create-letei-one.dto";



export class UpdateLeteiOneDto extends PartialType(CreateLeteiOneDto) {}
