import { Inject, Injectable } from '@nestjs/common';
import { REDIS_CLIENT } from './redis.constants';
import Redis from 'ioredis';
import { isJSON, isString } from 'class-validator';

@Injectable()
export class RedisService {
  constructor(
    @Inject(REDIS_CLIENT)
    private readonly redisClient: Redis,
  ) {}

  async set<T>(key: string, value: T, ttlSecond: number = 0) {
    await this.redisClient.set(
      key,
      isString(value) ? value : JSON.stringify(value),
      'EX',
      ttlSecond,
    );
  }

  async get<T>(key: string): Promise<T | null> {
    const data = await this.redisClient.get(key);

    if (!data) return null;

    return isJSON(data) ? (JSON.parse(data) as T) : (data as T);
  }

  async del(key: string) {
    return await this.redisClient.del(key);
  }
}
