import { Controller, Get, Post, Body, Req, Put, Param, Delete } from '@nestjs/common';
import { ContactService } from './contact.service';
import { Request } from 'express';
import { SubmitContactDto } from './dto/submit-contact.dto';
import { seconds, SkipThrottle, Throttle } from '@nestjs/throttler';
@Controller()
export class ContactController {
  constructor(private readonly svc: ContactService) {}

  // Public: fetch contact page content
  @SkipThrottle()
  @Get('contact-page')
  async getPage() {
    return this.svc.getPage();
  }


@Post('contact')
@Throttle({
  default: {
    limit: process.env.NODE_ENV === 'production' ? 5 : 1000,
    ttl: seconds(60),  // shorthand helper for milliseconds
  },
})

async submit(@Body() body: SubmitContactDto, @Req() req: Request) {
// controller snippet (inside submit())
const payload = {
  name: body.name,
  email: body.email,
  // turn null/empty into undefined so it matches `org?: string`
  org: body.org && body.org.trim() !== '' ? body.org.trim() : undefined,
  message: body.message,
        privacyConsent: body.privacyConsent, 
  ip: req.ip,
  userAgent: req.get('User-Agent') || undefined,
};

const saved = await this.svc.saveSubmission(payload);


    // TODO: optionally send notification email (SendGrid/Nodemailer) or webhook here

    return { ok: true, id: saved.id };
  }

  // Admin: upsert contact page (protect this route with your auth guard)
  @Put('admin/contact-page')
  async upsert(@Body() data: any) {
    return this.svc.upsertPage(data);
  }

  // Admin: list submissions (protect)
  @Get('admin/contact-submissions')
  async submissions() {
    return this.svc.listSubmissions();
  }
    // Admin: send a reply to a contact submission
@Post('admin/contact-submissions/:id/reply')
async replyToSubmission(
  @Param('id') id: string,
  @Body() body: { message: string },
) {
  return this.svc.replyToSubmission(Number(id), body.message); // ✅ cast to number
}
  // Admin: delete single submission
  @Delete('admin/contact-submissions/:id')
  async deleteSubmission(@Param('id') id: string) {
    return this.svc.deleteSubmission(Number(id));
  }

  // Admin: bulk delete submissions
  @Post('admin/contact-submissions/bulk-delete')
  async bulkDelete(@Body() body: { ids: number[] }) {
    return this.svc.bulkDeleteSubmissions(body.ids ?? []);
  }
}
