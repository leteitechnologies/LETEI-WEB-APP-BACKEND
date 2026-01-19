// src/book-pilot/book-pilot.controller.ts
import {
  Controller,
  Post,
  Body,
  Req,
  Headers,
  HttpCode,
  UsePipes,
  ValidationPipe,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { Request } from 'express';
import { BookPilotService } from './book-pilot.service';
import { CreateBookPilotDto } from './dto/create-book-pilot.dto';

@Controller()
export class BookPilotController {
  private readonly logger = new Logger(BookPilotController.name);

  constructor(private readonly service: BookPilotService) {}

  @Post('book-pilot')
  @HttpCode(200)
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async submit(
    @Body() dto: CreateBookPilotDto,
    @Req() req: Request,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    // Optional: verify recaptcha if you enable it (see notes below)
    // if (!process.env.DISABLE_RECAPTCHA) { ... }

    // Extract IP and UA
    const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').toString();
    const ua = (req.headers['user-agent'] || '').toString();



    const result = await this.service.createSubmission(dto, { ip, userAgent: ua, idempotencyKey });
    // if existing due to idempotency, return 200 with existing
    if (result.existing) {
      return {
        ok: true,
        id: result.submission.id,
        existing: true,
        message: 'Duplicate submission detected. Existing submission returned.',
      };
    }

    return {
      ok: true,
      id: result.submission.id,
      message: 'Submission received.',
    };
  }
}
