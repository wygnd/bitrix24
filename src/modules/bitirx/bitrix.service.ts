import { Inject, Injectable } from '@nestjs/common';
import type { B24Hook, Result } from '@bitrix24/b24jssdk';
import {
  B24AvailableMethods,
  B24Response,
} from './interfaces/bitrix.interface';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../redis/redis.service';
import { REDIS_CLIENT, REDIS_KEYS } from '../redis/redis.constants';
import { AppHttpService } from '../http/http.service';
import {
  BitrixOauthOptions,
  BitrixOauthResponse,
  BitrixTokens,
} from './interfaces/bitrix-auth.interface';
import { BitrixConfig } from '../../common/interfaces/bitrix-config.interface';

@Injectable()
export class BitrixService {
  private tokens: BitrixTokens | null = null;
  private readonly bitrixOauthUrl: string =
    'https://oauth.bitrix24.tech/oauth/token/';
  private readonly bitrixDomain: string;
  private readonly bitrixClientId: string;
  private readonly bitrixClientSecret: string;

  constructor(
    // @Inject('BITRIX24')
    // private readonly bx24: B24Hook,
    private readonly configService: ConfigService,
    @Inject(REDIS_CLIENT)
    private readonly redisService: RedisService,
    private readonly http: AppHttpService,
  ) {
    const bitrixConfig = configService.get<BitrixConfig>('bitrixConfig');

    if (!bitrixConfig) throw new Error('Invalid bitrix config');

    this.bitrixDomain = bitrixConfig.bitrixDomain;
    this.bitrixClientId = bitrixConfig.bitrixClientId;
    this.bitrixClientSecret = bitrixConfig.bitrixClientSecret;
  }

  // async call<T = Record<string, any>, K = any>(
  //   method: B24AvailableMethods,
  //   params?: T,
  // ): Promise<B24Response<K>> {
  //   const result = await this.bx24.callMethod(method, { ...params });
  //   return result.getData() as B24Response<K>;
  // }
  //
  // // todo: handle batch response
  // async callBatch(commands: any[] | object, halt = false) {
  //   const result = await this.bx24.callBatch(commands, halt, true);
  //
  //   if (!result.isSuccess) {
  //     console.error(result.getErrors());
  //     throw new Error('Failed to call batch');
  //   }
  //
  //   const response = {};
  //
  //   for (const [key, value] of Object.entries(result.getData() as object)) {
  //     response[key] = value.getData() as Result;
  //   }
  //
  //   return response;
  // }

  async callMethod<
    T extends Record<string, any> = Record<string, any>,
    U = any,
  >(method: string, params?: T) {
    console.log('Start calling');
    const { access_token } = await this.getTokens();

    console.log('Get Tokens', access_token);
    const data = await this.http.post<T, B24Response<U>>(
      `/rest/${method}`,
      params,
      {
        headers: {
          auth: access_token,
        },
      },
    );

    console.log('TRY SEND REQUEST TO BITRIX', data);

    return data;
  }

  private async getTokens(): Promise<BitrixTokens> {
    if (!this.tokens) {
      const refreshToken = await this.redisService.get<string>(
        REDIS_KEYS.BITRIX_REFRESH_TOKEN,
      );

      if (!refreshToken) throw new Error('Failed to refresh token');

      // todo: get token from db

      return await this.updateAccessToken(refreshToken);
    }

    if (this.tokens.access_token && Date.now() < this.tokens.expires)
      return this.tokens;

    return await this.updateAccessToken(this.tokens.access_token);
  }

  /**
   * Call auth url bitrix and get new access token
   * @param refreshToken string
   * @private
   */
  private async updateAccessToken(refreshToken: string): Promise<BitrixTokens> {
    const { access_token, expires, refresh_token } = await this.http.post<
      BitrixOauthOptions,
      BitrixOauthResponse
    >(
      '',
      {
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
        client_id: this.bitrixClientId,
        client_secret: this.bitrixClientSecret,
      },
      {
        baseURL: this.bitrixOauthUrl,
      },
    );

    this.tokens = {
      access_token: access_token,
      expires: expires,
      refresh_token: refresh_token,
    };

    try {
      await this.redisService.set<string>(
        REDIS_KEYS.BITRIX_ACCESS_TOKEN,
        access_token,
        -1,
      );
      await this.redisService.set<number>(
        REDIS_KEYS.BITRIX_ACCESS_EXPIRES,
        expires,
        -1,
      );
      await this.redisService.set<string>(
        REDIS_KEYS.BITRIX_REFRESH_TOKEN,
        refresh_token,
        -1,
      );
    } catch (error) {
      console.log(
        `Exception error on update access token and save in redis: `,
        error,
      );
    }

    return this.tokens;
  }
}
