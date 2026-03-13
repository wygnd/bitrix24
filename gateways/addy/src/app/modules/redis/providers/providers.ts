import { REDIS_CLIENT } from '../constants/constants';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { redisOptions } from '../services/redis.config-factory';
import { IEnvironmentOptions } from '@shared/interfaces/config/main';

export const redisProviders = [
  {
    provide: REDIS_CLIENT,
    useFactory: async (configService: ConfigService<IEnvironmentOptions>) => {
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
];
