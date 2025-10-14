import { Inject, Injectable } from '@nestjs/common';
import { REDIS_CLIENT } from './redis.constants';
import Redis from 'ioredis';

@Injectable()
export class RedisService {
  constructor(
    @Inject(REDIS_CLIENT)
    private readonly redisClient: Redis,
  ) {}

  async set<T>(key: string, value: T, ttlSecond: number = 900) {
    await this.redisClient.set(key, JSON.stringify(value), 'EX', ttlSecond);
  }

  async get<T>(key: string): Promise<T | null> {
    const data = await this.redisClient.get(key);
    return data ? (JSON.parse(data) as T) : null;
  }

  async del(key: string) {
    return await this.redisClient.del(key);
  }
}
