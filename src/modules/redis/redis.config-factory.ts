import { RedisOptions } from 'ioredis';
import { ConfigService } from '@nestjs/config';
import { redisRetryStrategy } from './redis.retry-strategy';

export const redisOptions = (configService: ConfigService): RedisOptions => {
  let totalRetryDuration = 0;
  const redisConfig = configService.get<RedisOptions>('redisConfig');

  if (!redisConfig) throw new Error("Redis config doesn't exist");

  const { host, port, username, password } = redisConfig;

  return {
    host,
    port: port ? +port : 6379,
    username: username,
    password: password,
    showFriendlyErrorStack: true,
    lazyConnect: true,
    commandTimeout: 1000,
    family: 0,
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
