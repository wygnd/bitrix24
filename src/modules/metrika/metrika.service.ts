import { Injectable } from '@nestjs/common';
import { WinstonLogger } from '@/config/winston.logger';
import { MetrikaApiService } from '@/modules/metrika/metrika-api.service';
import { isAxiosError } from 'axios';
import qs from 'qs';
import {
  IMetrikaStatDimensionsResponse,
  IMetrikaStatQueryFields,
  IMetrikaStatUserInfoOptions,
} from '@/modules/metrika/interfaces/metrika-stat.interface';
import { IMetrikaResponse } from '@/modules/metrika/interfaces/metrika.interface';
import { BitrixMessagesUseCase } from '@/modules/bitrix/application/use-cases/messages/messages.use-case';

@Injectable()
export class MetrikaService {
  private readonly logger = new WinstonLogger(
    MetrikaService.name,
    'yandex:metrika'.split(':'),
  );

  constructor(
    private readonly metrikaApi: MetrikaApiService,
    private readonly bitrixMessageService: BitrixMessagesUseCase,
  ) {}

  /**
   * Получает статистику
   * @param fields
   */
  async getMetrikaStatUserInfo(
    fields: IMetrikaStatQueryFields,
  ): Promise<IMetrikaResponse<IMetrikaStatDimensionsResponse[]> | null> {
    try {
      const data = await this.metrikaApi.get<
        any,
        IMetrikaResponse<IMetrikaStatDimensionsResponse[]>
      >(`/stat/v1/data?${qs.stringify(fields)}`);
      this.logger.debug({
        handler: this.getMetrikaStatUserInfo.name,
        request: fields,
        response: data,
      });
      return data;
    } catch (error) {
      let errorData;

      if (isAxiosError(error) && error.response?.data) {
        errorData = error.response.data;
      } else if (isAxiosError(error)) {
        errorData = error.response;
      } else if (error instanceof Error) {
        errorData = error.message;
      } else {
        errorData = 'Непредвиденная ошибка';
      }

      this.logger.error({
        handler: this.getMetrikaStatUserInfo.name,
        request: fields,
        response: errorData,
      });
    }

    return null;
  }

  /**
   * Get user info by ym_id
   *
   * ---
   *
   * Получает информацию о пользователе по ym_id
   * @private
   */
  async getMetrikaStringInfoByYmId(fields: IMetrikaStatUserInfoOptions) {
    try {
      const dimensionList = {
        'Страница входа': 'ym:s:startURL',
        utm_campaign: 'ym:s:automaticUTMCampaign',
        utm_content: 'ym:s:automaticUTMContent',
        utm_source: 'ym:s:automaticUTMSource',
        utm_term: 'ym:s:automaticUTMTerm',
        'Дата визита': 'ym:s:dateTime',
      };
      const { ymId, counterId, url } = fields;

      if (!ymId || !counterId)
        return {
          status: false,
          message: 'Invalid params',
        };

      const dateNow = new Date();
      const userData = await this.getMetrikaStatUserInfo({
        ids: counterId, // ID счетчика
        metrics: 'ym:s:visits', // Визиты
        visit_start_ts: dateNow.getTime(),
        visit_end_ts: dateNow.getTime() - 3600000,
        dimensions: Object.values(dimensionList).join(','),
        filters: `ym:s:clientID==${ymId}`, // user ID
        sort: '-ym:s:dateTime', // Сортируем от новым к старым
      });

      if (!userData || userData.data.length === 0)
        return {
          status: false,
          message: 'Not found data',
        };

      const [{ dimensions }] = userData.data;
      const dimensionsKeys = Object.keys(dimensionList);

      let index = 0;
      const message = dimensions.reduce((acc, { name }) => {
        if (!name) {
          index++;
          return acc;
        }

        let dimensionString: string;
        if (name.includes('https')) {
          const sliceIndex = name.indexOf('?');

          dimensionString =
            sliceIndex == -1
              ? `${dimensionsKeys[index]}: ${name}`
              : `${dimensionsKeys[index]}: ${name.slice(0, sliceIndex)}\n`;
        } else {
          dimensionString = `${dimensionsKeys[index]}: ${name}[br]`;
        }

        acc += dimensionString;
        index++;
        return acc;
      }, '');

      const responseSendMessage =
        await this.bitrixMessageService.sendPrivateMessage({
          DIALOG_ID: '376',
          MESSAGE: `[b]Новая заявка[/b][br][br]С сайта ${url}[br]` + message,
          URL_PREVIEW: 'N',
        });

      this.logger.debug({
        handler: this.getMetrikaStatUserInfo.name,
        request: fields,
        response: {
          message,
          responseSendMessage,
        },
      });

      return {
        status: true,
        message: 'Successful sent message',
      };
    } catch (error) {
      let errorData;

      if (isAxiosError(error) && error.response?.data) {
        errorData = error.response.data;
      } else if (isAxiosError(error)) {
        errorData = error.response;
      } else if (error instanceof Error) {
        errorData = error.message;
      } else {
        errorData = 'Непредвиденная ошибка';
      }

      this.logger.error({
        handler: this.getMetrikaStringInfoByYmId.name,
        request: fields,
        error: errorData,
      });

      return {
        status: false,
        message: errorData,
      };
    }
  }
}
