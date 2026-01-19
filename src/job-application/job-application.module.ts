import { Module } from '@nestjs/common';
import { JobApplicationController } from './job-application.controller';
import { JobApplicationService } from './job-application.service';
import { PrismaService } from '../prisma/prisma.service';
import { MailerModule } from '../mailer/mailer.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule,    // <--- REQUIRED
    MailerModule,    // <--- MailerService is exported from here
  ],
  controllers: [JobApplicationController],
  providers: [JobApplicationService, PrismaService],
  exports: [JobApplicationService],
})
export class JobApplicationModule {}
