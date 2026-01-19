import {
  INestApplication,
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
  Logger,
} from "@nestjs/common";
import { PrismaClient } from "@prisma/client";

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  private readonly maxRetries = 5; // you can tweak this
  private readonly baseDelay = 1000; // milliseconds, exponential backoff base

  async onModuleInit() {
    await this.connectWithRetry();
  }

  private async connectWithRetry(): Promise<void> {
    let attempt = 0;

    while (attempt < this.maxRetries) {
      try {
        this.logger.log(`Attempting Prisma DB connection (try ${attempt + 1}/${this.maxRetries})...`);
        await this.$connect();
        this.logger.log("✅ Prisma connected successfully.");
        return;
      } catch (error) {
        attempt++;
        this.logger.error(
          `❌ Prisma connection failed (attempt ${attempt}/${this.maxRetries}): ${error.message}`,
        );

        if (attempt >= this.maxRetries) {
          this.logger.error("🚨 Max retries reached. Prisma connection failed permanently.");
          throw error;
        }

        const delay = this.baseDelay * Math.pow(2, attempt - 1); // exponential backoff
        this.logger.warn(`Retrying Prisma connection in ${delay / 1000}s...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  async enableShutdownHooks(app: INestApplication) {
    (this as any).$on("beforeExit", async () => {
      this.logger.log("Prisma beforeExit hook triggered — closing app...");
      await app.close();
    });
  }

  async onModuleDestroy() {
    this.logger.log("Disconnecting Prisma...");
    await this.$disconnect();
    this.logger.log("✅ Prisma disconnected.");
  }
}
