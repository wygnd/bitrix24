import { Inject, Injectable } from '@nestjs/common';
import type { AxiosInstance } from 'axios';
import { ConfigService } from '@nestjs/config';
import { TelphinConfig } from '@/common/interfaces/telphin-config.interface';
import { TelphinTokenOptions } from '@/modules/telphin/interfaces/telphin-api.interface';
import { TokensService } from '@/modules/tokens/tokens.service';
import { TokensServices } from '@/modules/tokens/interfaces/tokens-serivces.interface';
import { WinstonLogger } from '@/config/winston.logger';

@Injectable()
export class TelphinService {
  private readonly logger = new WinstonLogger(TelphinService.name);
  private readonly telphinClientId: string;
  private readonly telphinClientSecret: string;

  constructor(
    private readonly configService: ConfigService,
    @Inject('TelphinApiProvider')
    private readonly telphinAPI: AxiosInstance,
    private readonly tokensService: TokensService,
  ) {
    const telphinConfig =
      this.configService.get<TelphinConfig>('telphinConfig');

    if (
      !telphinConfig ||
      Object.values(telphinConfig).filter((c) => !c).length !== 0
    )
      throw new Error(`${TelphinService.name.toUpperCase()}: Invalid config`);

    const { baseUrl, clientId, clientSecret } = telphinConfig;

    this.telphinClientId = clientId;
    this.telphinClientSecret = clientSecret;
    this.telphinAPI.defaults.baseURL = baseUrl;
    this.telphinAPI.defaults.headers['Content-Type'] = 'application/json';
    this.telphinAPI.defaults.headers['Accept-Encoding'] = 'gzip';

    this.tokensService
      .getToken(TokensServices.TELPHIN)
      .then((response) => {
        if (!response) {
          this.logger.error('Invalid get telphin token');
          this.updateToken();
          return;
        }
        this.telphinAPI.defaults.headers['Authorization'] =
          response.accessToken;
      })
      .catch((err) => this.logger.error(err));
  }

  public async updateToken() {
    try {
      const { access_token, expires_in } =
        await this.sendRequestOnUpdateTokens();

      await this.tokensService.updateToken(TokensServices.TELPHIN, {
        accessToken: access_token,
        expires: expires_in,
      });

      this.telphinAPI.defaults.headers['Authorization'] = access_token;
      return true;
    } catch (e) {
      console.log(e);
      this.logger.error(`Invalid update telphin token: ${e}`);
      return false;
    }
  }

  /**
   * Send request to telphin api for get new token
   *
   * ---
   *
   * Получение нового токена от telphin
   * @private
   */
  private async sendRequestOnUpdateTokens() {
    return this.telphinAPI.post<URLSearchParams, TelphinTokenOptions>(
      '',
      new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: this.telphinClientId,
        client_secret: this.telphinClientSecret,
      }),
      {
        baseURL: 'https://apiproxy.telphin.ru/oauth/token',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      },
    );
  }
}
