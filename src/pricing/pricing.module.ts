import { Module } from '@nestjs/common';
import { PricingService } from './pricing.service';
import { PricingController } from './pricing.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { FxModule } from '../fx-rates/fx.module';
import { RedisModule } from '../common/redis/redis.module';

import { PricingTierService } from './pricing-tier.service';
import { PricingTierWhyItemService } from './pricing-tier-why-item.service';
import { QuickEstimateService } from './quick-estimate.service';
import { WhyChooseService } from './why-choose.service';
import { PaymentMethodService } from './payment-method.service';
import { RevalidateService } from './revalidate.service';

@Module({
  imports: [
    PrismaModule,
    FxModule,
    RedisModule, // ensure your REDIS provider is exported from this module
  ],
  controllers: [PricingController],
  providers: [
    PricingService,
    PricingTierService,
    PricingTierWhyItemService,
    RevalidateService,
    QuickEstimateService,
    WhyChooseService,
    PaymentMethodService,
  ],
  exports: [PricingService], // export if you want other modules to call it
})
export class PricingModule {}
