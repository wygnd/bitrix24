import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  BitrixOauthResponse,
  BitrixTokens,
} from './interfaces/bitrix-auth.interface';
import { BitrixConfig } from '@/common/interfaces/bitrix-config.interface';
import {
  B24BatchResponseMap,
  B24SuccessResponse,
} from './interfaces/bitrix-api.interface';
import {
  B24AvailableMethods,
  B24AvailableMethodsV2,
  B24BatchCommands,
} from './interfaces/bitrix.interface';
import qs from 'qs';
import type { AxiosRequestConfig, AxiosResponse } from 'axios';
import { TokensService } from '@/modules/tokens/tokens.service';
import { TokensServices } from '@/modules/tokens/interfaces/tokens-serivces.interface';
import { WinstonLogger } from '@/config/winston.logger';
import { B24UserCurrent } from '@/modules/bitrix/application/interfaces/users/user-current.interface';
import { HttpService } from '@nestjs/axios';

@Injectable()
export class BitrixApiService {
  private readonly logger = new WinstonLogger(
    BitrixApiService.name,
    'bitrix'.split(':'),
  );
  private tokens: BitrixTokens;
  private readonly bitrixOauthUrl = 'https://oauth.bitrix24.tech/oauth/token/';
  private readonly bitrixClientId: string;
  private readonly bitrixClientSecret: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly http: HttpService,
    private readonly tokensService: TokensService,
  ) {
    const bitrixConfig = configService.get<BitrixConfig>('bitrixConfig');

    if (!bitrixConfig) throw new Error('Invalid bitrix config');

    this.bitrixClientId = bitrixConfig.bitrixClientId;
    this.bitrixClientSecret = bitrixConfig.bitrixClientSecret;

    this.tokens = {
      access_token: '',
      refresh_token: '',
      expires: 0,
    };
  }

  /**
   * Send request to bitrix
   * See https://apidocs.bitrix24.ru/ for target method
   * @param method - bitrix method
   * @param params - params for method.
   */
  async callMethod<
    T extends Record<string, any> = Record<string, any>,
    U = any,
  >(method: B24AvailableMethods, params: Partial<T> = {}) {
    const { access_token } = await this.getTokens();
    return this.post<Partial<T>, B24SuccessResponse<U>>(`/rest/${method}`, {
      ...params,
      auth: access_token,
    });
  }

  async callMethodV2<
    T extends Record<string, any> = Record<string, any>,
    U = any,
  >(method: B24AvailableMethodsV2, params: Partial<T> = {}) {
    const { access_token } = await this.getTokens();
    return this.post<Partial<T>, B24SuccessResponse<U>>(`/rest/api/${method}`, {
      ...params,
      auth: access_token,
    });
  }

  /**
   * Send batch request to bitrix
   * @param commands - object of list commands where key is unique id command and value is command object
   * @param halt
   */
  async callBatch<T extends Record<string, any>>(
    commands: B24BatchCommands,
    halt = false,
  ) {
    const { access_token } = await this.getTokens();

    const cmd = Object.entries(commands).reduce(
      (acc, [key, { method, params }]) => {
        acc[key] = `${method}?${qs.stringify(params)}`;
        return acc;
      },
      {} as Record<string, string>,
    );

    const response = (await this.post('/rest/batch', {
      cmd: cmd,
      halt: halt,
      auth: access_token,
    })) as B24BatchResponseMap;

    const errors = Object.entries(response.result.result_error).reduce(
      (acc, [command, errorData]) => {
        acc += `${command}: ${errorData.error}\n`;
        return acc;
      },
      '' as string,
    );

    if (errors && halt) throw new Error(errors);

    return response as B24BatchResponseMap<T>;
  }

  /**
   * Form batch batches request and return form response of object result
   *
   * ---
   *
   * Формирует пакет с пакетами запросов и возвращает отформатированный объект результата
   * @param commands
   * @param halt
   */
  async callBatches<T extends Record<string, any> = Record<string, any>>(
    commands: B24BatchCommands,
    halt = false,
  ): Promise<Record<string, T[keyof T]>> {
    let index = 0;
    let errors: string[] = [];
    const batchCommandsMap = new Map<number, B24BatchCommands>();

    Object.entries(commands).forEach(([cmdName, cmd]) => {
      let cmds = batchCommandsMap.get(index) ?? {};

      if (Object.keys(cmds).length === 50) {
        batchCommandsMap.set(index, cmds);
        index++;
        cmds = batchCommandsMap.get(index) ?? {};
      }

      cmds[cmdName] = cmd;

      batchCommandsMap.set(index, cmds);
    });

    const batchResponses = await Promise.all(
      Array.from(batchCommandsMap.values()).map((commands) => {
        return this.callBatch<Record<keyof T, T[keyof T]>>(commands, halt);
      }),
    );

    batchResponses.forEach((response) => {
      if (
        (Array.isArray(response.result.result_error) &&
          response.result.result_error.length === 0) ||
        Object.keys(response.result.result_error).length === 0
      )
        return;

      Object.entries(response.result.result_error).forEach(
        ([cmdName, { error, error_description }]) => {
          errors.push(`${cmdName}: ${error}, ${error_description}`);
        },
      );
    });

    if (errors.length > 0) throw new BadRequestException(errors);

    return batchResponses.reduce<Record<string, T[keyof T]>>(
      (acc, { result: { result } }) => {
        Object.entries(result).forEach(([commandName, response]) => {
          acc[commandName] = response;
        });

        return acc;
      },
      {},
    );
  }

  /**
   * Get bitrix tokens
   */
  public async getTokens(): Promise<BitrixTokens> {
    if (
      this.tokens &&
      this.tokens?.access_token &&
      Date.now() <= this.tokens.expires
    )
      return this.tokens;

    const tokens = await this.tokensService.getToken(TokensServices.BITRIX_APP);

    if (!tokens || !tokens.refreshToken) {
      this.logger.fatal('Invalid bitrix access or refresh token');
      throw new UnauthorizedException('Invalid refresh token');
    }

    const { accessToken, refreshToken, expires } = tokens;

    if (expires && Date.now() <= expires) {
      this.tokens = {
        access_token: accessToken,
        refresh_token: refreshToken,
        expires: expires,
      };

      return this.tokens;
    }

    return this.updateAccessToken(tokens.refreshToken);
  }

  /**
   * Update tokens and save in cache
   */
  public async updateTokens() {
    const tokens = await this.tokensService.getToken(TokensServices.BITRIX_APP);

    if (!tokens) throw new UnauthorizedException('Invalid update tokens');

    this.tokens = {
      access_token: tokens.accessToken,
      expires: tokens.expires,
      refresh_token: tokens.refreshToken ?? '',
    };

    return this.tokens;
  }

  /**
   * Call auth url bitrix to get new access token
   * @param refreshToken string
   * @private
   */
  private async updateAccessToken(refreshToken: string): Promise<BitrixTokens> {
    const { access_token, refresh_token, expires } = await this.post<
      object,
      BitrixOauthResponse
    >(
      '',
      {},
      {
        params: {
          refresh_token: refreshToken,
          grant_type: 'refresh_token',
          client_id: this.bitrixClientId,
          client_secret: this.bitrixClientSecret,
        },
        baseURL: this.bitrixOauthUrl,
      },
    );

    this.tokens = {
      access_token: access_token,
      expires: expires,
      refresh_token: refresh_token,
    };

    this.tokensService.updateOrCreateToken(TokensServices.BITRIX_APP, {
      accessToken: access_token,
      refreshToken: refresh_token,
      expires: expires * 1000,
    });

    return this.tokens;
  }

  /**
   * Base post request to bitrix
   * @param url
   * @param body
   * @param config
   * @private
   */
  private async post<T, U = any>(
    url: string,
    body: T,
    config?: AxiosRequestConfig<T>,
  ) {
    const response = await this.http.axiosRef.post<T, AxiosResponse<U>>(
      url,
      body,
      config,
    );

    return response.data;
  }

  public async getUserIdByAuth(authId: string) {
    try {
      const { result } = await this.post<
        object,
        B24SuccessResponse<B24UserCurrent>
      >(
        '/rest/user.current',
        {},
        {
          headers: {
            Authorization: `Bearer ${authId}`,
          },
        },
      );
      return result ?? null;
    } catch (e) {
      this.logger.error(e);
      return null;
    }
  }
}
