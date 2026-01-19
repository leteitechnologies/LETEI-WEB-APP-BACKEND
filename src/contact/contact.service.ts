import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MailerService } from 'src/mailer/mailer.service';
const logger = new Logger('ContactService');



export interface SaveSubmissionPayload {
  name: string;
  email: string;
  org?: string;
  message: string;
   privacyConsent: boolean; 
  ip?: string;
  userAgent?: string;
}
@Injectable()
export class ContactService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailer: MailerService,
  ) {}

  // get editable page data (single doc)
  async getPage() {
    const page = await this.prisma.contactPage.findFirst();
    if (!page) {
      // return sensible defaults
      return {
        title: 'Contact Us',
        subtitle: '',
        description: '',
        phone: '',
        email: '',
        location: '',
        faqs: [],
        seo: null,
      };
    }
    return page;
  }

async upsertPage(data: any) {
  const cleaned = {
    title: data.title,
    subtitle: data.subtitle || null,
    description: data.description || null,
    phone: data.phone || null,
    email: data.email || null,
    location: data.location || null,
    faqs: data.faqs?.length ? data.faqs : null,
    seo: data.seo && Object.keys(data.seo).length ? data.seo : null,
  };

  const socials = data.socials?.map((s: any) => ({
    kind: s.kind,
    url: s.url,
  }));

  const existing = await this.prisma.contactPage.findFirst({
    include: { socials: true },
  });

  if (existing) {
    return this.prisma.contactPage.update({
      where: { id: existing.id },
      data: {
        ...cleaned,
        socials: {
          deleteMany: {}, // clear old socials
          create: socials || [], // insert new socials
        },
      },
      include: { socials: true },
    });
  }

  return this.prisma.contactPage.create({
    data: {
      ...cleaned,
      socials: {
        create: socials || [],
      },
    },
    include: { socials: true },
  });
}




  async saveSubmission(payload: SaveSubmissionPayload) {
    const saved = await this.prisma.contactSubmission.create({
      data: {
        name: payload.name,
        email: payload.email,
        org: payload.org ?? undefined,
        message: payload.message,
             privacyConsent: payload.privacyConsent,
        ip: payload.ip ?? undefined,
        userAgent: payload.userAgent ?? undefined,
      },
    });

    const fromEmail = process.env.EMAIL_USER;
    const adminEmail = process.env.ADMIN_EMAIL;

    if (!fromEmail) {
      logger.error('EMAIL_USER not configured – cannot send emails');
      return saved;
    }

    // Notify admin
    if (adminEmail) {
      await this.mailer.sendMail({
        to: adminEmail,
        from: fromEmail,
        subject: `New contact from ${saved.name}`,
        html: this.mailer.renderContactNotification({
          name: saved.name,
          email: saved.email,
          org: saved.org,
          message: saved.message,
          submittedAt: saved.createdAt ?? new Date(),
        }),
        text: [
          `New Contact Submission`,
          `Name: ${saved.name}`,
          `Email: ${saved.email}`,
          `Org: ${saved.org ?? '-'}`,
          `Message: ${saved.message}`,
        ].join('\n'),
      });
    }

    // Acknowledge visitor (capture messageId)
    if (saved.email) {
      const info = await this.mailer.sendMail({
        to: saved.email,
        from: fromEmail,
        subject: `Thanks for contacting us`,
        html: this.mailer.renderContactAcknowledgement({
          name: saved.name,
        }),
        text: `Hi ${saved.name},\n\nThanks for your message. We'll get back to you soon.\n\n— Team`,
      });

      // Store messageId in DB for threading later
      if (info?.messageId) {
        await this.prisma.contactSubmission.update({
          where: { id: saved.id },
          data: { messageId: info.messageId },
        });
      }
    }

    return saved;
  }

async listSubmissions(limit = 50) {
  return this.prisma.contactSubmission.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      replies: {
        where: { deletedAt: null }, // 👈 filter replies here
        orderBy: { sentAt: 'asc' },
      },
    },
  });
}


  async replyToSubmission(id: number, message: string) {
    const submission = await this.prisma.contactSubmission.findUnique({
      where: { id },
    });

    if (!submission) {
      throw new Error('Submission not found');
    }

    const fromEmail = process.env.EMAIL_USER;
    if (!fromEmail) {
      throw new Error('EMAIL_USER not configured – cannot send reply');
    }

    // Send reply email (threaded if messageId exists)
    const info = await this.mailer.sendMail({
      to: submission.email,
      from: fromEmail,
      subject: `Re: Your contact submission`,
      html: `<p>Hi ${submission.name},</p><p>${message}</p>`,
      text: `Hi ${submission.name},\n\n${message}`,
      inReplyTo: submission.messageId ?? undefined,
      references: submission.messageId ? [submission.messageId] : undefined,
    });

    // Save reply in DB
    await this.prisma.contactReply.create({
      data: {
        contactSubmissionId: submission.id,
        message,
        sentAt: new Date(),
        messageId: info?.messageId, // store reply messageId too
      },
    });

    return { ok: true };
  }
// Soft delete a single submission
async deleteSubmission(id: number) {
  await this.prisma.contactSubmission.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
  return { ok: true };
}

// Bulk soft delete
async bulkDeleteSubmissions(ids: number[]) {
  if (!Array.isArray(ids) || ids.length === 0) {
    return { ok: false, deleted: 0 };
  }
  const result = await this.prisma.contactSubmission.updateMany({
    where: { id: { in: ids.map((i) => Number(i)) } },
    data: { deletedAt: new Date() },
  });
  return { ok: true, deleted: result.count };
}

async restoreSubmission(id: number) {
  await this.prisma.contactSubmission.update({
    where: { id },
    data: { deletedAt: null },
  });
  return { ok: true };
}

}