// backend/src/product-pages/product-pages.module.ts
import { Module } from "@nestjs/common";

import { PrismaModule } from "../prisma/prisma.module";
import { LeteiOnePageService } from "./LeteiOnePage.service";
import { LeteiOnePageController } from "./LeteiOnePage.controller";


@Module({
  imports: [PrismaModule],
  controllers: [LeteiOnePageController],
  providers: [LeteiOnePageService],
})
export class leteiOnePageModule {}
