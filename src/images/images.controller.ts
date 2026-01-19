import { Controller, Post, UseInterceptors, UploadedFile, Body, Get, Query, Delete, Param, Put, BadRequestException, ValidationPipe, UsePipes, HttpCode, HttpStatus } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ImagesService } from './images.service';
import { CreateAssetFromUrlDto } from './dto/create-asset-from-url.dto';

@Controller('assets')
export class ImagesController {
  constructor(private readonly svc: ImagesService) {}

  // direct upload (server-side streaming to Cloudinary)
  @Post('upload')
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } }))
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Body('postId') postId?: string,
    @Body('alt') alt?: string,
    @Body('caption') caption?: string,
    @Body('role') role?: string,
    @Body('idempotencyKey') idempotencyKey?: string,
  ) {
    if (!file) throw new BadRequestException('file required');
    const res = await this.svc.uploadBuffer(file.buffer, {
      filename: file.originalname,
      folder: process.env.CLOUDINARY_FOLDER,
      alt, caption, role, postId, idempotencyKey,
    });
    return res;
  }

  // list assets, optionally filtering by postId or status
  @Get()
  async list(@Query('postId') postId?: string, @Query('status') status?: string) {
    if (postId) return this.svc.listByPost(postId);
    // otherwise list all (paginated in prod) - here return recent
    return (await this.svc['prisma'].asset.findMany({ orderBy: { createdAt: 'desc' }, take: 50 }));
  }

  @Get(':id')
  async get(@Param('id') id: string) {
    return this.svc.getById(id);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.svc.delete(id);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: any) {
    return this.svc.updateMetadata(id, body);
  }

  // attach assets to a post by ordering list
  @Post('attach-to-post/:postId')
  async attach(@Param('postId') postId: string, @Body() body: { assetIds: string[] }) {
    return this.svc.attachAssetsToPost(postId, body.assetIds ?? []);
  }
    @Post()
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async createFromUrl(@Body() dto: CreateAssetFromUrlDto) {
    const created = await this.svc.createFromUrl(dto);
    return created;
  }
}
