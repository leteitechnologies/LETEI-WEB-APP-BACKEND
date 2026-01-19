// // src/mailer/mailer.service.ts
// import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
// import { ConfigService } from '@nestjs/config';
// import * as nodemailer from 'nodemailer';
// import type { SentMessageInfo } from 'nodemailer'; 
// export interface ChangeDetail {
//   field: string;
//   from: string;
//   to: string;
//   at: Date;
// }

// type CTA = {
//   label: string;
//   url: string;
// };

// @Injectable()
// export class MailerService {
//   private readonly transporter: nodemailer.Transporter;
//   private readonly logger = new Logger(MailerService.name);

//   // brand tokens
//   private readonly BRAND = {
//     button: '#2563EB', // primary blue
//     bg: '#f4f4f6',     // page background
//     cta: '#0b0b0c',    // CTA text color (as requested)
//     text: '#0b0b0c',
//     subtle: '#6b7280',
//     card: '#ffffff',
//     border: '#e5e7eb',
//   };

//   constructor(private readonly config: ConfigService) {
//     this.transporter = nodemailer.createTransport({
//       host: this.config.get('EMAIL_HOST', 'smtp.gmail.com'),
//       port: Number(this.config.get('EMAIL_PORT', 465)),
//       secure: true,
//       auth: {
//         user: this.config.get<string>('EMAIL_USER'),
//         pass: this.config.get<string>('EMAIL_PASS'),
//       },
//       pool: true,
//       maxConnections: 5,
//       maxMessages: 100,
//       connectionTimeout: 30_000,
//       greetingTimeout: 30_000,
//       socketTimeout: 60_000,
//       logger: true,
//       debug: true,
//     });

//     this.transporter.verify((err) => {
//       if (err) this.logger.error('❌ SMTP connection failed:', err);
//       else this.logger.log('✅ SMTP connection successful');
//     });
//   }

//   /**
//    * Public send method
//    */
//   async sendMail(options: nodemailer.SendMailOptions): Promise<SentMessageInfo> {
//     try {
//       const info = await this.transporter.sendMail(options);
//       this.logger.log(`📧 Email sent to ${options.to}, messageId=${info.messageId}`);
//       return info; // 👈 return SentMessageInfo, including messageId
//     } catch (err) {
//       this.logger.error('❌ Failed to send email', err);
//       throw new InternalServerErrorException('Failed to send email');
//     }
//   }

//   /**
//    * Base HTML layout with brand styles (table-based, inline CSS)
//    */
//   buildLayout({
//     title,
//     preheader,
//     bodyHtml,
//     cta,
//     footerNote,
//   }: {
//     title: string;
//     preheader?: string;
//     bodyHtml: string;
//     cta?: CTA;
//     footerNote?: string;
//   }): string {
//     const { bg, card, text, subtle, button, border, cta: ctaText } = this.BRAND;

//     const buttonHtml = cta
//       ? `
//         <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:24px 0 4px 0;">
//           <tr>
//             <td align="center" bgcolor="${button}" style="border-radius:9999px;">
//               <a href="${cta.url}"
//                  style="display:inline-block;padding:12px 20px;font-weight:600;text-decoration:none;
//                         border-radius:9999px;background:${button};color:${ctaText};"
//                  target="_blank" rel="noopener">
//                 ${cta.label}
//               </a>
//             </td>
//           </tr>
//         </table>
//         <div style="font-size:12px;line-height:18px;color:${subtle};">
//           If the button doesn’t work, copy and paste this link:<br/>
//           <a href="${cta.url}" style="color:${button};text-decoration:underline;word-break:break-all;">${cta.url}</a>
//         </div>
//       `
//       : '';

//     // Preheader (hidden)
//     const preheaderSpan = preheader
//       ? `<span style="display:none !important;visibility:hidden;opacity:0;color:transparent;height:0;width:0;overflow:hidden;mso-hide:all;">
//            ${preheader}
//          </span>`
//       : '';

//     return `
//     <!doctype html>
//     <html lang="en" xmlns="http://www.w3.org/1999/xhtml">
//     <head>
//       <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
//       <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
//       <title>${this.escape(title)}</title>
//     </head>
//     <body style="margin:0;padding:0;background:${bg};">
//       ${preheaderSpan}
//       <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:${bg};">
//         <tr>
//           <td align="center" style="padding:24px;">
//             <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width:600px;">
//               <!-- Card -->
//               <tr>
//                 <td style="background:${card};border:1px solid ${border};border-radius:16px;padding:32px;">
//                   <!-- Header -->
//                   <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
//                     <tr>
//                       <td style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:24px;line-height:32px;font-weight:700;color:${text};">
//                         ${this.escape(title)}
//                       </td>
//                     </tr>
//                   </table>

//                   <!-- Body -->
//                   <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;
//                               color:${text};font-size:14px;line-height:22px;margin-top:12px;">
//                     ${bodyHtml}
//                     ${buttonHtml}
//                   </div>
//                 </td>
//               </tr>

//               <!-- Footer -->
//               <tr>
//                 <td align="center" style="padding:16px 8px 0 8px;">
//                   <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;
//                               color:${subtle};font-size:12px;line-height:18px;">
//                     ${footerNote ? this.escape(footerNote) : 'You’re receiving this because you contacted us.'}
//                   </div>
//                 </td>
//               </tr>
//               <tr>
//                 <td style="height:24px;"></td>
//               </tr>
//             </table>
//           </td>
//         </tr>
//       </table>
//     </body>
//     </html>
//     `;
//   }

//   /**
//    * Notification email (to admin)
//    */
//   renderContactNotification({
//     name,
//     email,
//     org,
//     message,
//     submittedAt,
//   }: {
//     name: string;
//     email: string;
//     org?: string | null;
//     message: string;
//     submittedAt: Date | string;
//   }): string {
//     const bodyHtml = `
//       <p style="margin:0 0 8px 0;">You’ve received a new contact submission:</p>
//       <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"
//              style="margin:12px 0;border-collapse:separate;border-spacing:0 8px;">
//         <tr>
//           <td style="font-weight:600;width:120px;">Name</td>
//           <td>${this.escape(name)}</td>
//         </tr>
//         <tr>
//           <td style="font-weight:600;width:120px;">Email</td>
//           <td><a href="mailto:${this.escape(email)}" style="color:#2563EB;text-decoration:underline;">${this.escape(email)}</a></td>
//         </tr>
//         <tr>
//           <td style="font-weight:600;width:120px;">Organization</td>
//           <td>${org ? this.escape(org) : '-'}</td>
//         </tr>
//         <tr>
//           <td style="font-weight:600;width:120px;vertical-align:top;">Message</td>
//           <td style="white-space:pre-wrap;">${this.escape(message)}</td>
//         </tr>
//         <tr>
//           <td style="font-weight:600;width:120px;">Submitted</td>
//           <td>${this.escape(String(submittedAt))}</td>
//         </tr>
//       </table>
//     `;

//     return this.buildLayout({
//       title: 'New Contact Submission',
//       preheader: `New message from ${name}`,
//       bodyHtml,
//       // Optional CTA — e.g., open your admin
//       // cta: { label: 'Open in Admin', url: 'https://your-admin.example.com/contact' },
//       footerNote: 'This is an automated notification.',
//     });
//   }

//   /**
//    * Acknowledgement email (to visitor)
//    */
//   renderContactAcknowledgement({
//     name,
//     supportUrl,
//   }: {
//     name: string;
//     supportUrl?: string;
//   }): string {
//     const bodyHtml = `
//       <p style="margin:0 0 8px 0;">Hi ${this.escape(name)},</p>
//       <p style="margin:0 0 8px 0;">
//         Thanks for reaching out! We’ve received your message and a member of our team will respond soon.
//       </p>
//       <p style="margin:0 0 8px 0;">
//         In the meantime, you can browse our help resources or reply to this email if you have more details.
//       </p>
//     `;

//     return this.buildLayout({
//       title: 'We got your message 🙌',
//       preheader: 'Thanks for contacting us — we’ll get back to you soon.',
//       bodyHtml,
//       cta: supportUrl
//         ? { label: 'Visit Help Center', url: supportUrl }
//         : undefined,
//       footerNote: 'If this wasn’t you, you can safely ignore this email.',
//     });
//   }

//   /**
//    * Simple HTML escaper for text nodes
//    */
//   private escape(input: string): string {
//     return String(input)
//       .replace(/&/g, '&amp;')
//       .replace(/</g, '&lt;')
//       .replace(/>/g, '&gt;')
//       .replace(/"/g, '&quot;');
//   }
// }
// src/mailer/mailer.service.ts
import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import sgMail from '@sendgrid/mail';
import * as nodemailer from 'nodemailer';

type CTA = { label: string; url: string };

export type SendMailOptions = {
  to: string | string[];
  subject: string;
  html: string;                 // required
  text?: string;
  from?: string;
  inReplyTo?: string;           // optional threading header
  references?: string[];        // optional threading header(s)
  headers?: Record<string, string>; // arbitrary additional headers
};

@Injectable()
export class MailerService {
  private readonly logger = new Logger(MailerService.name);
  private readonly useSendGrid: boolean;
  private readonly sendGridFrom: string;
  private transporter?: nodemailer.Transporter;

  private readonly BRAND = {
    button: '#2563EB',
    bg: '#f4f4f6',
    cta: '#0b0b0c',
    text: '#0b0b0c',
    subtle: '#6b7280',
    card: '#ffffff',
    border: '#e5e7eb',
  };

  constructor(private readonly config: ConfigService) {
    const sgKey = this.config.get<string>('SENDGRID_API_KEY');
    this.sendGridFrom =
      this.config.get<string>('SENDGRID_FROM') ||
      this.config.get('EMAIL_USER') ||
      'noreply@example.com';
    this.useSendGrid = Boolean(sgKey);

    if (this.useSendGrid) {
      sgMail.setApiKey(sgKey!);
      this.logger.log('Using SendGrid for transactional email (SENDGRID_API_KEY found).');
    } else {
      const host = this.config.get('EMAIL_HOST', 'smtp.gmail.com');
      const port = Number(this.config.get('EMAIL_PORT', 465));
      const user = this.config.get('EMAIL_USER');
      const pass = this.config.get('EMAIL_PASS');

      if (!user || !pass) {
        this.logger.warn(
          'No SendGrid key and no SMTP credentials found — emails will fail until configured.',
        );
      }

      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: user && pass ? { user, pass } : undefined,
        pool: true,
        maxConnections: 5,
        maxMessages: 100,
        connectionTimeout: 30_000,
        greetingTimeout: 30_000,
        socketTimeout: 60_000,
        logger: false,
        debug: false,
      });

      this.transporter.verify((err) => {
        if (err) this.logger.error('SMTP connection verify failed (dev only):', err);
        else this.logger.log('SMTP connection verified (dev only).');
      });
    }
  }

  /** Generic send method supporting threading headers */
  async sendMail(opts: SendMailOptions): Promise<any> {
    const from = opts.from || this.sendGridFrom;

    if (this.useSendGrid) {
      // SendGrid accepts a headers object — map threading headers there.
      const headers: Record<string, string> = { ...(opts.headers || {}) };

      if (opts.inReplyTo) headers['In-Reply-To'] = opts.inReplyTo;
      if (opts.references) headers['References'] = Array.isArray(opts.references)
        ? opts.references.join(' ')
        : String(opts.references);

      const msg: any = {
        to: opts.to,
        from,
        subject: opts.subject,
        html: opts.html,
        ...(opts.text ? { text: opts.text } : {}),
        ...(Object.keys(headers).length ? { headers } : {}),
      };

      try {
        const res = await sgMail.send(msg as any);
        this.logger.log(`📧 SendGrid email queued to ${JSON.stringify(opts.to)} subject="${opts.subject}"`);
        return res;
      } catch (err) {
        this.logger.error('❌ SendGrid send failed', err);
        throw new InternalServerErrorException('Failed to send email (SendGrid)');
      }
    } else {
      // Nodemailer fallback — it supports inReplyTo/references directly
      if (!this.transporter) {
        this.logger.error('No transporter available for SMTP fallback.');
        throw new InternalServerErrorException('No SMTP transporter configured');
      }

      const mailOpts: any = {
        from,
        to: opts.to,
        subject: opts.subject,
        html: opts.html,
        ...(opts.text ? { text: opts.text } : {}),
        ...(opts.inReplyTo ? { inReplyTo: opts.inReplyTo } : {}),
        ...(opts.references ? { references: opts.references } : {}),
        ...(opts.headers ? { headers: opts.headers } : {}),
      };

      try {
        const info = await this.transporter.sendMail(mailOpts);
        this.logger.log(`📧 SMTP email sent to ${JSON.stringify(opts.to)} messageId=${info.messageId}`);
        return info;
      } catch (err) {
        this.logger.error('❌ Failed to send email (SMTP fallback)', err);
        throw new InternalServerErrorException('Failed to send email (SMTP)');
      }
    }
  }

  /* --- your existing HTML builders (kept verbatim) --- */

  buildLayout({
    title,
    preheader,
    bodyHtml,
    cta,
    footerNote,
  }: {
    title: string;
    preheader?: string;
    bodyHtml: string;
    cta?: CTA;
    footerNote?: string;
  }): string {
    const { bg, card, text, subtle, button, border, cta: ctaText } = this.BRAND;
    const buttonHtml = cta
      ? `
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:24px 0 4px 0;">
          <tr>
            <td align="center" bgcolor="${button}" style="border-radius:9999px;">
              <a href="${cta.url}"
                 style="display:inline-block;padding:12px 20px;font-weight:600;text-decoration:none;
                        border-radius:9999px;background:${button};color:${ctaText};"
                 target="_blank" rel="noopener">
                ${cta.label}
              </a>
            </td>
          </tr>
        </table>
        <div style="font-size:12px;line-height:18px;color:${subtle};">
          If the button doesn’t work, copy and paste this link:<br/>
          <a href="${cta.url}" style="color:${button};text-decoration:underline;word-break:break-all;">${cta.url}</a>
        </div>
      `
      : '';

    const preheaderSpan = preheader
      ? `<span style="display:none !important;visibility:hidden;opacity:0;color:transparent;height:0;width:0;overflow:hidden;mso-hide:all;">${preheader}</span>`
      : '';

    return `
    <!doctype html>
    <html lang="en" xmlns="http://www.w3.org/1999/xhtml">
    <head>
      <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
      <title>${this.escape(title)}</title>
    </head>
    <body style="margin:0;padding:0;background:${bg};">
      ${preheaderSpan}
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:${bg};">
        <tr>
          <td align="center" style="padding:24px;">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width:600px;">
              <tr>
                <td style="background:${card};border:1px solid ${border};border-radius:16px;padding:32px;">
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                    <tr>
                      <td style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:24px;line-height:32px;font-weight:700;color:${text};">
                        ${this.escape(title)}
                      </td>
                    </tr>
                  </table>
                  <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;
                              color:${text};font-size:14px;line-height:22px;margin-top:12px;">
                    ${bodyHtml}
                    ${buttonHtml}
                  </div>
                </td>
              </tr>
              <tr>
                <td align="center" style="padding:16px 8px 0 8px;">
                  <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;
                              color:${subtle};font-size:12px;line-height:18px;">
                    ${footerNote ? this.escape(footerNote) : 'You’re receiving this because you contacted us.'}
                  </div>
                </td>
              </tr>
              <tr>
                <td style="height:24px;"></td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
    `;
  }

  renderContactNotification({ name, email, org, message, submittedAt }: { name: string; email: string; org?: string | null; message: string; submittedAt: Date | string; }): string {
    const bodyHtml = `
      <p style="margin:0 0 8px 0;">You’ve received a new contact submission:</p>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"
             style="margin:12px 0;border-collapse:separate;border-spacing:0 8px;">
        <tr>
          <td style="font-weight:600;width:120px;">Name</td>
          <td>${this.escape(name)}</td>
        </tr>
        <tr>
          <td style="font-weight:600;width:120px;">Email</td>
          <td><a href="mailto:${this.escape(email)}" style="color:#2563EB;text-decoration:underline;">${this.escape(email)}</a></td>
        </tr>
        <tr>
          <td style="font-weight:600;width:120px;">Organization</td>
          <td>${org ? this.escape(org) : '-'}</td>
        </tr>
        <tr>
          <td style="font-weight:600;width:120px;vertical-align:top;">Message</td>
          <td style="white-space:pre-wrap;">${this.escape(message)}</td>
        </tr>
        <tr>
          <td style="font-weight:600;width:120px;">Submitted</td>
          <td>${this.escape(String(submittedAt))}</td>
        </tr>
      </table>
    `;

    return this.buildLayout({
      title: 'New Contact Submission',
      preheader: `New message from ${name}`,
      bodyHtml,
      footerNote: 'This is an automated notification.',
    });
  }

  renderContactAcknowledgement({ name, supportUrl }: { name: string; supportUrl?: string; }): string {
    const bodyHtml = `
      <p style="margin:0 0 8px 0;">Hi ${this.escape(name)},</p>
      <p style="margin:0 0 8px 0;">
        Thanks for reaching out! We’ve received your message and a member of our team will respond soon.
      </p>
      <p style="margin:0 0 8px 0;">
        In the meantime, you can browse our help resources or reply to this email if you have more details.
      </p>
    `;

    return this.buildLayout({
      title: 'We got your message 🙌',
      preheader: 'Thanks for contacting us — we’ll get back to you soon.',
      bodyHtml,
      cta: supportUrl ? { label: 'Visit Help Center', url: supportUrl } : undefined,
      footerNote: 'If this wasn’t you, you can safely ignore this email.',
    });
  }

  private escape(input: string): string {
    return String(input).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
}

