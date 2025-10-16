import { REDIS_CLIENT } from './redis.constants';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { redisOptions } from './redis.config-factory';
import { AuthModel } from './redis.entity';

export const redisProviders = [
  {
    provide: REDIS_CLIENT,
    useFactory: (configService: ConfigService) => {
      const client = new Redis(redisOptions(configService));
      client.on('error', (e) => console.error(`REDIS: Error execute: ${e}`));
      return client;
    },
    inject: [ConfigService],
  },
  {
    provide: 'AuthRepository',
    useValue: AuthModel,
  },
];
