import {
  Body,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  Req,
  Res,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CreateJobApplicationDto } from './dto/create-job-application.dto';
import { JobApplicationService } from './job-application.service';
import { Request, Response } from 'express';
import * as path from 'path';
import * as fs from 'fs-extra';

@Controller('apply')
export class JobApplicationController {
  constructor(private readonly svc: JobApplicationService) {}

  /**
   * Accepts both multipart/form-data (with optional "cv" file) and JSON (no file).
   * We attach a Multer interceptor saving files temporarily to ./tmp/uploads.
   */
  @Post()
  @UseInterceptors(
    FileInterceptor('cv', {
      dest: path.join(process.cwd(), 'tmp', 'uploads'),
      limits: { fileSize: 8 * 1024 * 1024 }, // 8MB
    }),
  )
  async create(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() body: CreateJobApplicationDto,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    // basic validation: name & email required (for JSON flows too)
    if (!body?.name || !body?.email) {
      // if file-only request may also be missing fields
      throw new BadRequestException('Missing required fields: name and email');
    }

    try {
      const meta = {
        ip: (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress,
        userAgent: req.headers['user-agent'] as string | undefined,
        idempotencyKey: (req.headers['idempotency-key'] as string) || body.idempotencyKey || undefined,
      };

      const result = await this.svc.createApplication(body, file, meta);

      // Ensure we remove local tmp file (if exists) - service will already do that but safe to cleanup here too
      if (file && file.path) {
        try { await fs.remove(file.path); } catch (e) { /* swallow */ }
      }

      return res.status(HttpStatus.CREATED).json(result);
    } catch (err: any) {
      console.error('[apply controller] error', err);
      const status = err?.status || 500;
      const message = err?.message || 'Server error';
      return res.status(status).json({ error: message });
    }
  }
}
