import { Injectable } from '@nestjs/common';
import { AvitoApiService } from '@/modules/avito/avito-api.service';
import { AvitoRejectDistributeDealByAiRequest } from '@/modules/avito/interfaces/avito-reject-distribute-deal-by-ai.interface';

@Injectable()
export class AvitoService {
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
    return this.avitoApiService.post<AvitoRejectDistributeDealByAiRequest>(
      '/messenger-db/warnings/by-phone',
      {
        phone,
        message,
      },
    );
  }
}
