import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateClientDto } from "./dtos/create-client.dto";
import { UpdateClientDto } from "./dtos/update-client.dto";
import { ImagesService } from "../images/images.service"; 

@Injectable()
export class ClientsService {
  private readonly logger = new Logger(ClientsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly imagesService: ImagesService, // optional; remove if not using
  ) {}

  async findAll() {
    return this.prisma.client.findMany({ orderBy: { createdAt: "asc" } });
  }

  async findOne(id: number) {
    return this.prisma.client.findUnique({ where: { id } });
  }

  /**
   * Create client when you already have an external logoUrl
   * or when upload is performed externally and passed in DTO.
   */
  async create(dto: CreateClientDto) {
    const client = await this.prisma.client.create({
      data: {
        name: dto.name,
        logoUrl: dto.logoUrl ?? null,
      },
    });
    return client;
  }

  /**
   * Create client while uploading logo buffer (used by controller file upload).
   * If you don't support file uploads, ignore this and use create(dto).
   */
// clients.service.ts (only the method changed)
async createWithUpload(
  name: string,
  fileBuffer: Buffer,
  filename: string,
  mimetype?: string
) {
  // upload the buffer to ImagesService using the options object that uploadBuffer expects
  const asset = await this.imagesService.uploadBuffer(fileBuffer, {
    filename,
    // optionally set a folder for client logos
    folder: 'clients',
    // include mimetype if you want (ImagesService currently doesn't use it directly, but it's OK to pass)
    mimetype,
    uploadedBy: undefined,
  });

  // uploadBuffer returns the prisma asset record (when Cloudinary configured)
  // get the url from the returned asset
  const url = asset?.url ?? null;

  return this.prisma.client.create({
    data: {
      name,
      logoUrl: url,
    },
  });
}

  async update(id: number, dto: UpdateClientDto) {
    return this.prisma.client.update({
      where: { id },
      data: {
        name: dto.name,
        logoUrl: dto.logoUrl ?? undefined,
      },
    });
  }

  async remove(id: number) {
    return this.prisma.client.delete({ where: { id } });
  }
}
