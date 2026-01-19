import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  ParseIntPipe,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  UseGuards,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ClientsService } from "./clients.service";
import { CreateClientDto } from "./dtos/create-client.dto";
import { UpdateClientDto } from "./dtos/update-client.dto";


@Controller()
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  // Public endpoint used by frontend
  @Get("clients")
  async findAll() {
    const clients = await this.clientsService.findAll();
    // return minimal data for frontend
    return clients.map((c) => ({ name: c.name, logoUrl: c.logoUrl ?? null }));
  }

  // Admin endpoints (protect these with an auth guard in production)
 // <- replace or remove based on your auth
  @Post("admin/clients")
  async create(@Body() dto: CreateClientDto) {
    // If dto.logoUrl is supplied, simply create; else admin should use upload endpoint below
    return this.clientsService.create(dto);
  }

  // Alternative endpoint for uploading logo + creating record in one go

  @Post("admin/clients/upload")
  @UseInterceptors(FileInterceptor("logo"))
  async createWithUpload(
    @Body("name") name: string,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (!name) throw new BadRequestException("name is required");
    if (!file) throw new BadRequestException("logo file is required");
    // file.buffer available if using memoryStorage or if you've configured multer to store buffer
    const buffer = (file as any).buffer;
    if (!buffer) throw new BadRequestException("File buffer unavailable — configure multer memoryStorage");
    const created = await this.clientsService.createWithUpload(name, buffer, file.originalname, file.mimetype);
    return created;
  }


  @Put("admin/clients/:id")
  async update(@Param("id", ParseIntPipe) id: number, @Body() dto: UpdateClientDto) {
    return this.clientsService.update(id, dto);
  }


  @Delete("admin/clients/:id")
  async remove(@Param("id", ParseIntPipe) id: number) {
    return this.clientsService.remove(id);
  }
}
