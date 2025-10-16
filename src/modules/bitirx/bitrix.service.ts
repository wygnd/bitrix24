import { Inject, Injectable } from '@nestjs/common';
import type { B24Hook, Result } from '@bitrix24/b24jssdk';
import {
  B24AvailableMethods,
  B24Response,
} from './interfaces/bitrix.interface';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../redis/redis.service';
import { REDIS_CLIENT, REDIS_KEYS } from '../redis/redis.constants';
import { AppHttpService } from '../http/http.service';

@Injectable()
export class BitrixService {
  private readonly bitrixAuthUrl: string;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private expiresAt: number = 0;

  constructor(
    @Inject('BITRIX24')
    private readonly bx24: B24Hook,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    @Inject(REDIS_CLIENT)
    private readonly redisService: RedisService,
    private readonly http: AppHttpService,
  ) {
    const bitrixConfig = configService.get<string>('bitrixConfig');

    if (!bitrixConfig) throw new Error('Invalid bitrix config');
  }

  async call<T = Record<string, any>, K = any>(
    method: B24AvailableMethods,
    params?: T,
  ): Promise<B24Response<K>> {
    const result = await this.bx24.callMethod(method, { ...params });
    return result.getData() as B24Response<K>;
  }

  async callTest<T = Record<string, any>, K = any>(
    method: B24AvailableMethods,
    params?: T,
  ) {
    return await this.callMethod(method, { ...params });
  }

  // todo: handle batch response
  async callBatch(commands: any[] | object, halt = false) {
    const result = await this.bx24.callBatch(commands, halt, true);

    if (!result.isSuccess) {
      console.error(result.getErrors());
      throw new Error('Failed to call batch');
    }

    const response = {};

    for (const [key, value] of Object.entries(result.getData() as object)) {
      response[key] = value.getData() as Result;
    }

    return response;
  }

  // todo
  private async callMethod(method: string, params: any = {}) {
    this.http.post(
      `/rest/${method}`,
      {},
      {
        headers: {
          auth: await this.getRefreshToken(),
        },
      },
    );
  }

  // todo
  public async refreshAccessToken() {}

  private async getAccessToken(): Promise<string> {
    if(this.accessToken !== null && Date.now() < this.expiresAt) return this.accessToken;

    const accessTokenFromCache = await this.redisService.get<string>(REDIS_KEYS.BITRIX_ACCESS_TOKEN);

    // if(!accessTokenFromCache) {}
  }

  private async getRefreshToken() {
    // if()

    const tokenFromCache = await this.redisService.get<string>(
      REDIS_KEYS.BITRIX_REFRESH_TOKEN,
    );

    if (!tokenFromCache) {
      console.log('Failed to get refresh token');
      return '';
    }

    return tokenFromCache;
  }
}
