import { Module } from "@nestjs/common";
import { ClientsService } from "./clients.service";
import { ClientsController } from "./clients.controller";
import { PrismaModule } from "../prisma/prisma.module";
import { ImagesModule } from "../images/images.module"; // optional - replace with your module

@Module({
  imports: [PrismaModule, ImagesModule], // ImagesModule optional; only if you have one
  providers: [ClientsService],
  controllers: [ClientsController],
  exports: [ClientsService],
})
export class ClientsModule {}
