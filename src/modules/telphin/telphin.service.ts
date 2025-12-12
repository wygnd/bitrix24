import { Injectable } from '@nestjs/common';
import { TelphinApiService } from '@/modules/telphin/telphin-api.service';
import { TelphinUserInfo } from '@/modules/tokens/interfaces/telphin-user.interface';
import { RedisService } from '@/modules/redis/redis.service';
import { REDIS_KEYS } from '@/modules/redis/redis.constants';

@Injectable()
export class TelphinService {
  constructor(
    private readonly telphinApiService: TelphinApiService,
    private readonly redisService: RedisService,
  ) {}

  public async getCurrentCalls(clientId: number) {
    return this.telphinApiService.get(`/client/${clientId}/current_calls/`);
  }

  public async finishCall() {}

  /**
   * Get user info/application from telphin
   *
   * ---
   *
   * Получить информацию о текущем пользователе/приложении
   */
  public async getUserInfo(): Promise<TelphinUserInfo | null> {
    const userInfoFromCache = await this.redisService.get<TelphinUserInfo>(
      REDIS_KEYS.TELPHIN_USER_INFO,
    );

    if (userInfoFromCache) return userInfoFromCache;

    const userInfo =
      await this.telphinApiService.get<TelphinUserInfo>(`/user/`);

    if (!userInfo) return null;

    this.redisService.set<TelphinUserInfo>(
      REDIS_KEYS.TELPHIN_USER_INFO,
      userInfo,
      3600, // 1 hour
    );

    return userInfo;
  }
}
