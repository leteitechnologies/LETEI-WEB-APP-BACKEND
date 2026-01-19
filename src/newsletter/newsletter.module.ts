// src/newsletter/newsletter.module.ts
import { Module } from '@nestjs/common';
import { NewsletterService } from './newsletter.service';
import { NewsletterController } from './newsletter.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { MailerModule } from '../mailer/mailer.module';

@Module({
  imports: [PrismaModule, MailerModule],
  providers: [NewsletterService],
  controllers: [NewsletterController],
})
export class NewsletterModule {}
