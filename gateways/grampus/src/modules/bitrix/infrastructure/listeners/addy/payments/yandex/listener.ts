import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { YandexDirectInvoiceGeneratedEvent } from '@/modules/bitrix/application/events/addy/payments/yandex/direct/invoice-generated.event';
import { YandexDirectInvoiceEvent } from '@/modules/bitrix/application/constants/events/addy/yandex/direct/constants';
import { AddyService } from '@/modules/addy/services/service';
import { WinstonLogger } from '@/config/winston.logger';
import { maybeCatchError } from '@/common/utils/catch-error';

@Injectable()
export class BitrixAddyYandexDirectListener {
  private readonly logger = new WinstonLogger(
    BitrixAddyYandexDirectListener.name,
    'bitrix:addy:payments:listeners'.split(':'),
  );

  constructor(private readonly addyService: AddyService) {}

  @OnEvent(YandexDirectInvoiceEvent)
  async handleInvoiceGeneratedEvent(
    payload: YandexDirectInvoiceGeneratedEvent,
  ) {
    try {
      const response = await this.addyService.sendInvoiceData({
        client_invoice_id: payload.invoice_id,
        invoice_number: payload.invoice_number,
      });

      this.logger.debug({
        handler: this.handleInvoiceGeneratedEvent.name,
        request: payload,
        response,
      });
    } catch (error) {
      this.logger.error({
        handler: this.handleInvoiceGeneratedEvent.name,
        request: payload,
        error: maybeCatchError(error),
      });
    }
  }
}
