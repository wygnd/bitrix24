import { RedisOptions } from 'ioredis';
import { ConfigService } from '@nestjs/config';
import { redisRetryStrategy } from './redis.retry-strategy';
import { IEnvironmentOptions } from '@shared/interfaces/config/main';

export const redisOptions = (
  configService: ConfigService<IEnvironmentOptions>,
): RedisOptions => {
  let totalRetryDuration = 0;
  const redisConfig = configService.getOrThrow('redis', { infer: true });

  return {
    host: redisConfig.host,
    port: parseInt(redisConfig.port),
    username: redisConfig.user,
    password: redisConfig.password,
    showFriendlyErrorStack: true,
    lazyConnect: true,
    commandTimeout: 1000,
    family: 0,
    db: 1,
    maxRetriesPerRequest: 3,
    retryStrategy: (times) => {
      const { delay, retryDuration } = redisRetryStrategy(
        times,
        totalRetryDuration,
      );
      totalRetryDuration = retryDuration;
      return delay;
    },
  };
};
