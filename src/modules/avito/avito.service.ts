import { Injectable } from '@nestjs/common';
import { AvitoApiService } from '@/modules/avito/avito-api.service';
import { AvitoRejectDistributeDealByAiRequest } from '@/modules/avito/interfaces/avito-reject-distribute-deal-by-ai.interface';
import { WinstonLogger } from '@/config/winston.logger';

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
      this.logger.error({
        handler: this.rejectDistributeLeadByAi.name,
        error,
      });
      throw error;
    }
  }
}
