// backend/src/letei-space-page/letei-space.module.ts
import { Module } from '@nestjs/common';
import { LeteiSpaceService } from './letei-space.service';
import { LeteiSpaceController } from './letei-space.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { FxModule } from 'src/fx-rates/fx.module';

@Module({
  imports: [PrismaModule, FxModule],
  providers: [LeteiSpaceService],
  controllers: [LeteiSpaceController],
  exports: [LeteiSpaceService],
})
export class LeteiSpaceModule {}
