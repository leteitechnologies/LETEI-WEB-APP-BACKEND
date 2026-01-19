// backend/src/app.module.ts
import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';

import { PrismaModule } from "./prisma/prisma.module";

import { CaseStudiesModule } from "./case-studies/case-studies.module";
import { ContactModule } from "./contact/contact.module";
import { PricingModule } from "./pricing/pricing.module";
import { FxModule } from "./fx-rates/fx.module";
import { redisProvider } from "./common/redis/redis.provider";
import { BlogModule } from "./blog/blog.module";
import { ImagesModule } from "./images/images.module";
import { leteiOnePageModule } from "./letei-one-page/LeteiOnePage.module";
import { LeteiSpaceModule } from "./letei-space-page/letei-space.module";
import { ClientsModule } from "./clients/clients.module";
import { CloudinaryModule } from "./cloudinary/cloudinary.module";
import { BookPilotModule } from "./book-pilot/book-pilot.module";
import { JobApplicationModule } from "./job-application/job-application.module";
import { AuthorsModule } from "./authors/authors.module";
import { NewsletterModule } from "./newsletter/newsletter.module";

@Module({
  imports: [
    // throttler config — place first or anywhere inside imports
ThrottlerModule.forRoot({
  throttlers: [
    {
      ttl: 60_000, // 60 seconds
      limit: process.env.NODE_ENV === 'production' ? 10 : 1000,
    },
  ],
}),


    PrismaModule,
    AuthorsModule,
    JobApplicationModule,
leteiOnePageModule,
CloudinaryModule,
BookPilotModule,
LeteiSpaceModule,
    ClientsModule,
    CaseStudiesModule,
    NewsletterModule,
    ContactModule,
     PricingModule,
      ImagesModule,
     FxModule, 
        BlogModule,
  ],
  providers: [
    redisProvider,
    // apply throttling guard app-wide
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
