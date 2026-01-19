// src/common/redis.provider.ts
import { Provider } from '@nestjs/common';
import Redis from 'ioredis';

export const REDIS = 'REDIS_CLIENT';

export const redisProvider: Provider = {
  provide: REDIS,
  useFactory: () => {
    const url = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
    const client = new Redis(url, {
      maxRetriesPerRequest: 3,
      enableAutoPipelining: true,
      retryStrategy(times) {
        return Math.min(200 + times * 100, 20000);
      },
    });

    client.on('error', (err) => {
      // implement centralized logging if you have
      // Logger? console for simplicity
      // IMPORTANT: do not throw here (keep app running if Redis offline)
      // console.error('Redis error', err);
    });

    return client;
  },
};
