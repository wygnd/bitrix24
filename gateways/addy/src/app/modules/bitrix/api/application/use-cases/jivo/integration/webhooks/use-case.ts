import {
  BadRequestException,
  Injectable,
  MethodNotAllowedException,
} from '@nestjs/common';
import { WinstonLogger } from '@shared/logger/winston.logger';
import { maybeCatchError } from '@shared/utils/catch-error';
import { IB24JivoIntegrationWebhookRequest } from '../../../../interfaces/jivo/integration/webhooks/requests/interface';

@Injectable()
export class B24JivoIntegrationWebhooksUseCase {
  private readonly logger = new WinstonLogger(
    B24JivoIntegrationWebhooksUseCase.name,
    'bitrix/jivo/integration/webhooks',
  );

  constructor() {}

  public async handleWebhookCallEvent(body: IB24JivoIntegrationWebhookRequest) {
    try {
      this.logger.debug({
        handler: this.handleWebhookCallEvent.name,
        message: 'Debug',
        request: body,
      });

      return {
        status: true,
      };
    } catch (error) {
      this.logger.error({
        handler: this.handleWebhookCallEvent.name,
        request: body,
        error: maybeCatchError(error),
      });
      throw error;
    }
  }
}
