// src/book-pilot/book-pilot.module.ts
import { Module } from '@nestjs/common';
import { BookPilotService } from './book-pilot.service';
import { BookPilotController } from './book-pilot.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { MailerModule } from '../mailer/mailer.module';

@Module({
  imports: [PrismaModule, MailerModule],
  providers: [BookPilotService],
  controllers: [BookPilotController],
})
export class BookPilotModule {}
