// src/newsletter/newsletter.controller.ts
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
} from '@nestjs/common';
import { Request } from 'express';
import { NewsletterService } from './newsletter.service';
import { CreateSubscribeDto } from './dto/create-subscribe.dto';

@Controller()
export class NewsletterController {
  private readonly logger = new Logger(NewsletterController.name);

  constructor(private readonly service: NewsletterService) {}

  @Post('subscribe')
  @HttpCode(200)
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async subscribe(
    @Body() dto: CreateSubscribeDto,
    @Req() req: Request,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').toString();
    const ua = (req.headers['user-agent'] || '').toString();

    const result = await this.service.createSubscription(dto, { ip, userAgent: ua, idempotencyKey });

    if (result.existing) {
      return {
        ok: true,
        id: result.subscription.id,
        existing: true,
        message: 'Duplicate subscription detected. Existing record returned.',
      };
    }

    return {
      ok: true,
      id: result.subscription.id,
      message: 'Subscription received.',
    };
  }
}
