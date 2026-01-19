// src/newsletter/newsletter.service.ts
import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MailerService } from '../mailer/mailer.service';
import { CreateSubscribeDto } from './dto/create-subscribe.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class NewsletterService {
  private readonly logger = new Logger(NewsletterService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mailer: MailerService,
  ) {}

  /**
   * Create subscription (idempotent by idempotencyKey or by email).
   * Returns { existing: boolean, subscription }
   */
  async createSubscription(dto: CreateSubscribeDto, meta: { ip?: string; userAgent?: string; idempotencyKey?: string }) {
    const idKey = meta.idempotencyKey?.trim();
    // If idempotencyKey provided, check for existing record first
    if (idKey) {
      const existing = await this.prisma.newsletterSubscription.findUnique({ where: { idempotencyKey: idKey } });
      if (existing) {
        this.logger.log(`Found existing subscription for idempotencyKey=${idKey}, returning existing id=${existing.id}`);
        return { existing: true, subscription: existing };
      }
    }

    // Also treat duplicate email gracefully
    const existingByEmail = await this.prisma.newsletterSubscription.findUnique({ where: { email: dto.email } }).catch(() => null);
    if (existingByEmail) {
      this.logger.log(`Found existing subscription for email=${dto.email}`);
      return { existing: true, subscription: existingByEmail };
    }

    const messageId = `subscribe_${uuidv4()}`;
    try {
      const subscription = await this.prisma.newsletterSubscription.create({
        data: {
          name: dto.name ?? '',
          email: dto.email,
          phone: dto.phone ?? null,
          userAgent: meta.userAgent ?? null,
          ip: meta.ip ?? null,
          idempotencyKey: idKey ?? undefined,
          messageId,
          privacyConsent: !!dto.privacyConsent,
          status: 'PROCESSING',
        },
      });

      // send notifications async
      this.notifyAsync(subscription).catch(err => {
        this.logger.error('notifyAsync failed', err);
        // fallback: mark FAILED
        this.prisma.newsletterSubscription.update({
          where: { id: subscription.id },
          data: { status: 'FAILED' },
        }).catch(e => this.logger.error('Failed to set FAILED status', e));
      });

      return { existing: false, subscription };
    } catch (err) {
      this.logger.error('Failed to create subscription', err);
      throw new InternalServerErrorException('Failed to record subscription');
    }
  }

  private async notifyAsync(subscription: any) {
    const adminHtml = this.mailer.buildLayout({
      title: `New Subscribe request: ${this.escape(subscription.email)}`,
      preheader: `New subscription by ${this.escape(subscription.email)}`,
      bodyHtml: `
        <p><strong>Name:</strong> ${this.escape(subscription.name ?? '-')}</p>
        <p><strong>Email:</strong> ${this.escape(subscription.email)}</p>
        <p><strong>Phone:</strong> ${this.escape(subscription.phone ?? '-')}</p>
        <p><strong>IP:</strong> ${this.escape(subscription.ip ?? '-')}</p>
        <p><strong>User Agent:</strong><br/>${this.escape(subscription.userAgent ?? '-')}</p>
        <p>Subscription ID: ${this.escape(String(subscription.id))}</p>
      `,
      footerNote: 'Automated notification.',
    });

    // ack HTML to subscriber - you can change template as needed
const ackHtml = this.mailer.buildLayout({
  title: ``,
  preheader: `Exciting updates and stories, just for you`,
  bodyHtml: `
    <div style="font-family: 'Helvetica Neue', Arial, sans-serif; color: #0b0b0c; line-height: 1.6; text-align: center;">

      <!-- Logo -->
      <div style="margin-bottom: 32px;">
        <img src="https://res.cloudinary.com/dahrcnjfh/image/upload/v1757418274/logo_mocozq.png" alt="Letei Logo" style="width: 120px; height: auto; display: block; margin: 0 auto;" />
      </div>

      <!-- Welcome message -->
      <h2 style="color: rgb(122, 90, 66); font-size: 26px; margin-bottom: 20px;">
        Hi ${this.escape(subscription.name?.split(' ')[0] ?? 'there')}, welcome to Letei!
      </h2>

      <p style="font-size: 16px; max-width: 520px; margin: 0 auto 28px;">
        Thank you for subscribing! You’re now part of a community passionate about building technology that transforms lives, empowers communities, and celebrates local talent.
      </p>

      <!-- What to expect -->
      <div style="background-color: rgb(11, 11, 12); color: white; padding: 20px; border-radius: 16px; max-width: 480px; margin: 0 auto 28px; text-align: left;">
        <strong style="display: block; margin-bottom: 12px;">What to expect:</strong>
        <ol style="margin: 0; padding-left: 20px;">
          <li style="margin-bottom: 10px;">Stories of impact in classrooms and communities</li>
          <li style="margin-bottom: 10px;">Tips, guides, and insights for growing digital skills</li>
          <li>Updates on our latest products and program</li>
        </ol>
      </div>

      <p style="font-size: 16px; max-width: 520px; margin: 0 auto 28px;">
        We can’t wait to share our journey with you. Every email is a chance to learn, be inspired, and see the difference technology can make.
      </p>

      <!-- CTA Button -->
      <div style="margin-bottom: 36px;">
        <a href="https://yourwebsite.com" style="display: inline-block; padding: 14px 28px; background-color: rgb(11, 11, 12); color: white; border-radius: none; text-decoration: none; font-weight: bold; font-size: 16px;">
          Explore Our Stories
        </a>
      </div>

 <!-- Email Footer with sections (REPLACE THIS ENTIRE DIV) -->
<div style="background-color: #f8f8f8; padding: 24px; border-radius: 16px; max-width: 600px; margin: 0 auto; text-align: left; font-size: 14px; color: #555;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse;">
    <tr>
      <!-- Column 1 -->
      <td valign="top" style="padding: 0 12px; vertical-align: top;">
        <div style="display: block; font-weight: 700; font-size: 14px; margin: 0 0 8px;">Services</div>
        <ul style="list-style: none; padding: 0; margin: 0;">
          <li style="padding: 0; margin: 0 0 6px;">Product Strategy</li>
          <li style="padding: 0; margin: 0 0 6px;">AI &amp; Data</li>
          <li style="padding: 0; margin: 0 0 6px;">Engineering</li>
          <li style="padding: 0; margin: 0 0 0;">UX/UI Design</li>
        </ul>
      </td>

      <!-- Column 2 -->
      <td valign="top" style="padding: 0 12px; vertical-align: top;">
        <div style="display: block; font-weight: 700; font-size: 14px; margin: 0 0 8px;">Company</div>
        <ul style="list-style: none; padding: 0; margin: 0;">
          <li style="padding: 0; margin: 0 0 6px;"><a href="/about" style="color:#555; text-decoration:none;">About</a></li>
          <li style="padding: 0; margin: 0 0 6px;"><a href="/careers" style="color:#555; text-decoration:none;">Careers</a></li>
          <li style="padding: 0; margin: 0 0 0;"><a href="/contact" style="color:#555; text-decoration:none;">Contact</a></li>
        </ul>
      </td>

      <!-- Column 3 -->
      <td valign="top" style="padding: 0 12px; vertical-align: top;">
        <div style="display: block; font-weight: 700; font-size: 14px; margin: 0 0 8px;">Resources</div>
        <ul style="list-style: none; padding: 0; margin: 0;">
          <li style="padding: 0; margin: 0 0 6px;"><a href="/blog" style="color:#555; text-decoration:none;">Blog</a></li>
          <li style="padding: 0; margin: 0 0 6px;"><a href="/privacy" style="color:#555; text-decoration:none;">Privacy Policy</a></li>
          <li style="padding: 0; margin: 0 0 6px;"><a href="/terms" style="color:#555; text-decoration:none;">Terms</a></li>
          <li style="padding: 0; margin: 0 0 0;"><a href="/cookies" style="color:#555; text-decoration:none;">Cookie Policy</a></li>
        </ul>
      </td>
    </tr>
  </table>

  <!-- Social links -->
  <div style="margin-top: 16px; text-align: center;">
    <a href="#" style="margin: 0 6px; text-decoration: none; color:#555;">LinkedIn</a> |
    <a href="#" style="margin: 0 6px; text-decoration: none; color:#555;">X</a> |
    <a href="#" style="margin: 0 6px; text-decoration: none; color:#555;">Instagram</a> |
    <a href="#" style="margin: 0 6px; text-decoration: none; color:#555;">TikTok</a>
  </div>

  <!-- Bottom note -->
  <p style="margin-top: 16px; font-size: 12px; color: #888; text-align: center;">
    © ${new Date().getFullYear()} Letei Technologies Inc. All rights reserved. You received this email because you subscribed to Letei updates.
  </p>
</div>


    </div>
  `,
  footerNote: 'Reply to this email for support or questions.',
});




    const tasks = [
      this.mailer.sendMail({
        to: process.env.ADMIN_EMAIL,
        from: process.env.EMAIL_FROM,
        subject: `New subscription — ${subscription.email}`,
        html: adminHtml,
      }),
      this.mailer.sendMail({
        to: subscription.email,
        from: process.env.EMAIL_FROM,
        subject: `Thanks for subscribing`,
        html: ackHtml,
      }),
    ];

    const results = await Promise.allSettled(tasks);
    const ok = results.every(r => r.status === 'fulfilled');
    await this.prisma.newsletterSubscription.update({
      where: { id: subscription.id },
      data: { status: ok ? 'COMPLETED' : 'FAILED' },
    });
    this.logger.log(`Notifications for subscription ${subscription.id} finished. success=${ok}`);
    return results;
  }

  private escape(input: string) {
    return String(input ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}
