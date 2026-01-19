// src/book-pilot/book-pilot.service.ts
import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MailerService } from '../mailer/mailer.service';
import { CreateBookPilotDto } from './dto/create-book-pilot.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class BookPilotService {
  private readonly logger = new Logger(BookPilotService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mailer: MailerService,
  ) {}

  /**
   * Create or return existing submission for idempotencyKey.
   */
  async createSubmission(dto: CreateBookPilotDto, meta: { ip?: string; userAgent?: string; idempotencyKey?: string }) {
    const idKey = meta.idempotencyKey?.trim();
    // If idempotencyKey provided, check for existing record first
    if (idKey) {
      const existing = await this.prisma.bookPilotSubmission.findUnique({ where: { idempotencyKey: idKey } });
      if (existing) {
        this.logger.log(`Found existing submission for idempotencyKey=${idKey}, returning existing id=${existing.id}`);
        return { existing: true, submission: existing };
      }
    }

    // create record with PENDING status
    const messageId = `bookpilot_${uuidv4()}`; // simple message id
    try {
      const submission = await this.prisma.bookPilotSubmission.create({
        data: {
          name: dto.name,
          email: dto.email,
          company: dto.company,
          userAgent: meta.userAgent ?? null,
          ip: meta.ip ?? null,
          idempotencyKey: idKey ?? undefined,
          messageId,
          privacyConsent: !!dto.privacyConsent,
          status: 'PROCESSING',
        },
      });

      // Async notifications: send admin notif and acknowledgement
      this.notifyAsync(submission).catch(err => {
        this.logger.error('notifyAsync failed', err);
        // mark submission as FAILED in DB if needed
        this.prisma.bookPilotSubmission.update({
          where: { id: submission.id },
          data: { status: 'FAILED' },
        }).catch(e => this.logger.error('Failed to set FAILED status', e));
      });

      return { existing: false, submission };
    } catch (err) {
      this.logger.error('Failed to create submission', err);
      throw new InternalServerErrorException('Failed to record submission');
    }
  }

  /** Fire-and-forget notification logic */
  private async notifyAsync(submission: any) {
    // build admin email body
    const adminHtml = this.mailer.buildLayout({
      title: `New Book Pilot Request: ${this.escape(submission.name)}`,
      preheader: `New pilot request from ${this.escape(submission.name)}`,
      bodyHtml: `
        <p><strong>Name:</strong> ${this.escape(submission.name)}</p>
        <p><strong>Email:</strong> ${this.escape(submission.email)}</p>
        <p><strong>Company:</strong> ${this.escape(submission.company)}</p>
        <p><strong>IP:</strong> ${this.escape(submission.ip ?? '-')}</p>
        <p><strong>User Agent:</strong><br/>${this.escape(submission.userAgent ?? '-')}</p>
        <p>Submission ID: ${this.escape(String(submission.id))}</p>
      `,
      footerNote: 'Automated notification.',
    });

    const ackHtml = this.mailer.renderContactAcknowledgement({
      name: submission.name,
      supportUrl: process.env.SUPPORT_URL,
    });

    // Use Promise.allSettled so we don't throw on single failure
    const tasks = [
      this.mailer.sendMail({
        to: process.env.ADMIN_EMAIL,
        from: process.env.EMAIL_FROM,
        subject: `New Book Pilot request — ${submission.name}`,
        html: adminHtml,
      }),
      this.mailer.sendMail({
        to: submission.email,
        from: process.env.EMAIL_FROM,
        subject: `Thanks for requesting a pilot`,
        html: ackHtml,
      }),
    ];

    const results = await Promise.allSettled(tasks);
    // update DB status based on results
    const ok = results.every(r => r.status === 'fulfilled');
    await this.prisma.bookPilotSubmission.update({
      where: { id: submission.id },
      data: { status: ok ? 'COMPLETED' : 'FAILED' },
    });
    this.logger.log(`Notifications for submission ${submission.id} finished. success=${ok}`);
    return results;
  }

  private escape(input: string) {
    return String(input)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}
