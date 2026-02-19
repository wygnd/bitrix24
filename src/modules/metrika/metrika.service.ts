import { Injectable } from '@nestjs/common';
import { WinstonLogger } from '@/config/winston.logger';
import { MetrikaApiService } from '@/modules/metrika/metrika-api.service';
import { isAxiosError } from 'axios';
import qs from 'qs';
import {
  IMetrikaStatDimensionsResponse,
  IMetrikaStatQueryFields,
} from '@/modules/metrika/interfaces/metrika-stat.interface';
import { IMetrikaResponse } from '@/modules/metrika/interfaces/metrika.interface';

@Injectable()
export class MetrikaService {
  private readonly logger = new WinstonLogger(
    MetrikaService.name,
    'yandex:metrika'.split(':'),
  );

  constructor(private readonly metrikaApi: MetrikaApiService) {}

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
}
