// backend/src/letei-one-page/letei-one-page.controller.ts
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  Post,
  Put,
} from "@nestjs/common";


import { LeteiOnePageService } from "./LeteiOnePage.service";
import { CreateLeteiOneDto } from "./dto/create-letei-one.dto";
import { UpdateLeteiOneDto } from "./dto/update-letei-one.dto";



@Controller()
export class LeteiOnePageController {
  constructor(private readonly svc: LeteiOnePageService) {}

  @Get("letei-one-page")
  async findAll() {
    return this.svc.findAll();
  }

  @Get("letei-one-page/:slug")
  async findOne(@Param("slug") slug: string) {
    const p = await this.svc.findOne(slug);
    if (!p) throw new NotFoundException("Letei-one-page page not found");
    return p;
  }

  @Post("letei-one-page")
  async create(@Body() dto: CreateLeteiOneDto) {
    return this.svc.create(dto);
  }

  @Put("letei-one-page/:slug")
  async update(@Param("slug") slug: string, @Body() dto: UpdateLeteiOneDto) {
      console.log("Incoming letei-one-page update for", slug, "body:", JSON.stringify(dto).slice(0, 2000));
    return this.svc.update(slug, dto);
  }

  @Delete("letei-one-page/:slug")
  @HttpCode(200)
  async remove(@Param("slug") slug: string) {
    return this.svc.remove(slug);
  }
  @Put("letei-one-page/:slug/protect")
async setProtected(
  @Param("slug") slug: string,
  @Body("protected") value: boolean,
) {
  return this.svc.setProtected(slug, value);
}

}
