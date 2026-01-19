// src/job-application/job-application.service.ts
import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MailerService } from '../mailer/mailer.service';
import { CreateJobApplicationDto } from './dto/create-job-application.dto';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs-extra';
import * as path from 'path';
import { v2 as cloudinary } from 'cloudinary';

@Injectable()
export class JobApplicationService {
  private readonly logger = new Logger(JobApplicationService.name);
  private useCloudinary = process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET;

  constructor(private prisma: PrismaService, private mailer: MailerService) {
    if (this.useCloudinary) {
      cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
        secure: true,
      });
      this.logger.log('Cloudinary configured for job application uploads');
    } else {
      this.logger.log('Cloudinary not configured; falling back to local public/uploads for CVs');
    }
  }

  /**
   * Creates the job application; if an idempotencyKey is provided and we find an existing record,
   * we return the existing entry instead of inserting a duplicate.
   */
  async createApplication(
    dto: CreateJobApplicationDto,
    file?: Express.Multer.File,
    meta?: { ip?: string; userAgent?: string; idempotencyKey?: string },
  ) {
    const idKey = meta?.idempotencyKey?.trim();
    if (idKey) {
      const existing = await this.prisma.jobApplication.findUnique({ where: { idempotencyKey: idKey } });
      if (existing) {
        this.logger.log(`Idempotency key matched, returning existing application id=${existing.id}`);
        return { existing: true, application: existing };
      }
    }

    // prepare file upload if exists
    let cvUrl: string | null = null;
    let fileName: string | null = null;
    let fileSize: number | null = null;
    let mimetype: string | null = null;

    if (file) {
      fileName = file.originalname;
      fileSize = file.size;
      mimetype = file.mimetype;

      try {
        if (this.useCloudinary) {
          // Upload to Cloudinary
          const folder = process.env.CLOUDINARY_FOLDER || 'job_applications';
          const publicId = `app_${Date.now()}_${uuidv4()}`;

          // cloudinary.uploader.upload accepts path directly
          const uploadResult = await cloudinary.uploader.upload(file.path, {
            folder,
            public_id: publicId,
            resource_type: 'auto', // handles pdf/doc/image/etc.
            use_filename: false,
            unique_filename: false,
            overwrite: false,
          });

          cvUrl = uploadResult.secure_url || uploadResult.url || null;
          this.logger.log(`Uploaded CV to Cloudinary: ${cvUrl}`);
          // remove local tmp file
          await fs.remove(file.path).catch((e) => this.logger.warn('Failed to remove tmp file after cloud upload', e));
        } else {
          // Move file into public/uploads and return public URL
          const publicDir = path.join(process.cwd(), 'public', 'uploads');
          await fs.ensureDir(publicDir);
          const safeName = `${Date.now()}_${uuidv4()}_${file.originalname.replace(/\s+/g, '_')}`;
          const dest = path.join(publicDir, safeName);
          await fs.move(file.path, dest, { overwrite: true });
          const base = (process.env.APP_BASE_URL || '').replace(/\/$/, '');
          cvUrl = base ? `${base}/uploads/${safeName}` : `/uploads/${safeName}`;
        }
      } catch (err) {
        // Attempt to cleanup the temp file
        try { if (file?.path) await fs.remove(file.path); } catch (_) {}
        this.logger.error('Failed to upload CV', err);
        throw new InternalServerErrorException('Failed to upload CV');
      }
    }

    const messageId = `jobapp_${uuidv4()}`;

    try {
      const created = await this.prisma.jobApplication.create({
        data: {
          name: dto.name,
          email: dto.email,
          role: dto.role ?? null,
          notes: dto.notes ?? null,
          cvUrl: cvUrl ?? dto.cvLink ?? null,
          fileName: fileName ?? null,
          fileSize: fileSize ?? null,
          mimetype: mimetype ?? null,
          userAgent: meta?.userAgent ?? null,
          ip: meta?.ip ?? null,
          idempotencyKey: idKey ?? undefined,
          messageId,
          status: 'PROCESSING',
        },
      });

      // Fire-and-forget notif
      this.notifyAsync(created).catch((err) => {
        this.logger.error('Notification failed', err);
        // set FAILED status but don't block response
        this.prisma.jobApplication.update({ where: { id: created.id }, data: { status: 'FAILED' } }).catch(() => {});
      });

      return { existing: false, application: created };
    } catch (err) {
      this.logger.error('Failed to create JobApplication', err);
      // Cleanup: if we stored a local public file (not Cloudinary), consider deleting it here.
      throw new InternalServerErrorException('Failed to save application');
    }
  }

  /**
   * notifyAsync: send admin notification and candidate ack; update DB status on completion
   */
  private async notifyAsync(application: any) {
      const adminEmail = process.env.ADMIN_EMAIL;
  const fromEmail = process.env.EMAIL_FROM;

  if (!adminEmail || !fromEmail) {
    this.logger.error('Missing ADMIN_EMAIL or EMAIL_FROM env vars');
    return;
  }

    const adminHtml = this.mailer.buildLayout({
      title: `New job application — ${this.escape(application.name)}`,
      preheader: `New application from ${this.escape(application.name)}`,
      bodyHtml: `
        <p><strong>Name:</strong> ${this.escape(application.name)}</p>
        <p><strong>Email:</strong> ${this.escape(application.email)}</p>
        <p><strong>Role:</strong> ${this.escape(application.role ?? '-')}</p>
        <p><strong>IP:</strong> ${this.escape(application.ip ?? '-')}</p>
        <p><strong>User Agent:</strong><br/>${this.escape(application.userAgent ?? '-')}</p>
        <p><strong>CV:</strong> ${application.cvUrl ? `<a href="${this.escape(application.cvUrl)}">download</a>` : 'none'}</p>
        <p>Application ID: ${this.escape(String(application.id))}</p>
      `,
      footerNote: 'Automated notification',
    });

    const ackHtml = this.mailer.renderContactAcknowledgement({
      name: application.name,
      supportUrl: process.env.SUPPORT_URL,
    });

  const tasks = [
    this.mailer.sendMail({
      to: adminEmail,  // now guaranteed string
      from: fromEmail,
      subject: `New job application — ${application.name}`,
      html: adminHtml,
    }),
    this.mailer.sendMail({
      to: application.email,  // this should always exist
      from: fromEmail,
      subject: `Thanks for your application`,
      html: ackHtml,
    }),
  ];


    const results = await Promise.allSettled(tasks);
    const ok = results.every((r) => r.status === 'fulfilled');

    await this.prisma.jobApplication.update({
      where: { id: application.id },
      data: { status: ok ? 'COMPLETED' : 'FAILED' },
    });

    this.logger.log(`Notifications for application ${application.id} finished. success=${ok}`);
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
