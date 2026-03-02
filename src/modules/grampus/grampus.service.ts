import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { WinstonLogger } from '@/config/winston.logger';
import { AxiosRequestConfig, AxiosResponse } from 'axios';
import { IGrampusBadLink } from '@/modules/grampus/interfaces/grampus-bad-link.interface';
import { ConfigService } from '@nestjs/config';
import { IGrampusBriefResponse } from '@/modules/grampus/interfaces/grampus-brief.interface';
import { maybeCatchError } from '@/common/utils/catch-error';

@Injectable()
export class GrampusService {
  private readonly logger = new WinstonLogger(
    GrampusService.name,
    'grampus'.split(':'),
  );

  constructor(
    private readonly http: HttpService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Realize base POST request
   *
   * ---
   *
   * Реализует базовый POST запрос
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
    try {
      const { data } = await this.http.axiosRef.post<T, AxiosResponse<U>>(
        url,
        body,
        config,
      );
      this.logger.log({
        handler: this.post.name,
        request: {
          url,
          data,
        },
        response: data,
      });
      return data;
    } catch (error) {
      this.logger.error({
        handler: this.post.name,
        request: {
          url,
          body,
        },
        response: error,
      });
      throw error;
    }
  }

  /**
   * Send request to Grampus server to block bots and spammers
   *
   * ---
   *
   * Отправляет запрос на сервер Grampus, чтобы заблокировать спамеров
   * @param data
   */
  public async notifyBadLink(data: IGrampusBadLink) {
    return Promise.resolve('Mock implementation');
    // return this.post('/', data);
  }

  /**
   * Get brief data by id
   *
   * ---
   *
   * Получает данные брифа по id
   * @param briefId
   */
  public async getBriefData(briefId: string) {
    try {
      const { data } = await this.http.axiosRef.post<
        any,
        AxiosResponse<IGrampusBriefResponse<Record<string, any>[]>>
      >(
        '/wp-json/brief/data/get',
        {},
        {
          baseURL: this.configService.getOrThrow('grampusConfig.briefUrl'),
          params: new URLSearchParams({
            brief_id: briefId,
          }),
          headers: {
            Accept: 'application/json',
          },
        },
      );
      this.logger.debug({
        handler: this.getBriefData.name,
        request: briefId,
        response: data,
      });

      return data;
    } catch (error) {
      this.logger.error({
        handler: this.getBriefData.name,
        request: briefId,
        message: maybeCatchError(error),
      });

      throw error;
    }
  }
}
