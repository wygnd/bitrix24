import { REDIS_CLIENT } from './redis.constants';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { redisOptions } from './redis.config-factory';
import { AuthModel } from './redis.entity';

export const redisProviders = [
  {
    provide: REDIS_CLIENT,
    useFactory: async (configService: ConfigService) => {
      const client = new Redis(redisOptions(configService));
      client.on('error', (e) => console.error(`REDIS: Error connecting: ${e}`));
      try {
        await client?.connect?.();
      } catch (error) {
        console.error(`REDIS: Failed to connect: ${error}`);
      }
      return client;
    },
    inject: [ConfigService],
  },
  {
    provide: 'AuthRepository',
    useValue: AuthModel,
  },
];
