import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MailerService } from './mailer.service';

@Module({
  imports: [ConfigModule], // because MailerService uses ConfigService
  providers: [MailerService],
  exports: [MailerService], // 👈 make it available to other modules
})
export class MailerModule {}
