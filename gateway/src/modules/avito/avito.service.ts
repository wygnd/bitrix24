import { Injectable } from '@nestjs/common';
import { AvitoApiService } from '@/modules/avito/avito-api.service';
import { AvitoRejectDistributeDealByAiRequest } from '@/modules/avito/interfaces/avito-reject-distribute-deal-by-ai.interface';
import { WinstonLogger } from '@/config/winston.logger';
import { isAxiosError } from 'axios';

@Injectable()
export class AvitoService {
  private readonly logger = new WinstonLogger(
    AvitoService.name,
    'avito'.split(':'),
  );

  constructor(private readonly avitoApiService: AvitoApiService) {}

  /**
   * Send request to avito service about rejected lead by AI
   * @param phone
   * @param message
   */
  public async rejectDistributeLeadByAi(
    phone: string,
    message: string = 'Лид, созданный AI отклонен для обработки',
  ) {
    try {
      const response =
        await this.avitoApiService.post<AvitoRejectDistributeDealByAiRequest>(
          '/messenger-db/warnings/by-phone',
          {
            phone,
            message,
          },
        );
      this.logger.debug({
        handler: this.rejectDistributeLeadByAi.name,
        response,
      });
      return response;
    } catch (error) {
      let errorData: any;

      if (isAxiosError(error) && error.response) {
        errorData = error.response.data;
      } else if (isAxiosError(error)) {
        errorData = error.response;
      } else if (error instanceof Error) {
        errorData = error.message;
      } else {
        errorData = 'Непредвиденная ошибка';
      }

      this.logger.error({
        handler: this.rejectDistributeLeadByAi.name,
        error: errorData,
      });

      throw error;
    }
  }
}
