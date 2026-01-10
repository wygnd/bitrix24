import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BitrixImBotService } from '@/modules/bitrix/modules/imbot/imbot.service';
import {
  BitrixAddyPaymentsSendMessageOptions,
  BitrixAddyPaymentsSendMessageResponse,
} from '@/modules/bitrix/modules/integration/addy/interfaces/addy-payments-send-message.interface';
import { BitrixAddyPaymentOptions } from '@/common/interfaces/bitrix-config.interface';
import { WinstonLogger } from '@/config/winston.logger';
import { BitrixApiService } from '@/modules/bitrix/bitrix-api.service';
import { B24ImboKeyboardAddyPaymentsApprove } from '@/modules/bitrix/modules/imbot/interfaces/imbot-keyboard-addy-payments-approve.interface';

@Injectable()
export class BitrixAddyPaymentsService {
  private readonly logger = new WinstonLogger(BitrixAddyPaymentsService.name, [
    'addy',
  ]);
  private readonly paymentOptions: BitrixAddyPaymentOptions;

  constructor(
    private readonly configService: ConfigService,
    private readonly bitrixBotService: BitrixImBotService,
    private readonly bitrixService: BitrixApiService,
  ) {
    const addySupportOptions = this.configService.get<BitrixAddyPaymentOptions>(
      'bitrixConstants.ADDY.payment',
    );

    if (
      !addySupportOptions ||
      Object.values(addySupportOptions).filter((v) => !v).length > 0
    )
      throw new Error(
        `${BitrixAddyPaymentsService.name.toUpperCase()}: Invalid config`,
      );

    this.paymentOptions = addySupportOptions;
  }

  public async sendMessage(
    fields: BitrixAddyPaymentsSendMessageOptions,
  ): Promise<BitrixAddyPaymentsSendMessageResponse> {
    try {
      const responseData: BitrixAddyPaymentsSendMessageResponse = {
        status: false,
        message: 'Not handling',
      };
      const { user_id, contract, price, client, link } = fields;
      const message =
        `Счет на оплату[br]${link}[br]${user_id} ${contract}[br]` +
        `${this.bitrixService.formatPrice(price / 100)}[br]${client}`;

      const { result } = await this.bitrixBotService.sendMessage({
        DIALOG_ID: this.paymentOptions.bitrixChatId,
        MESSAGE: message,
        KEYBOARD: [
          {
            TEXT: 'Копировать ссылку',
            BG_COLOR_TOKEN: 'base',
            DISPLAY: 'LINE',
            ACTION: 'COPY',
            ACTION_VALUE: link,
          },
          {
            TEXT: 'Подтвердить платеж',
            COMMAND: 'approveAddyPaymentOnPay',
            COMMAND_PARAMS: JSON.stringify({
              message: this.bitrixBotService.encodeText(
                message
                  .replace(`${link}[br]`, '')
                  .replace('Счет на оплату', '[b]Счет оплачен[/b]'),
              ),
            } as B24ImboKeyboardAddyPaymentsApprove),
            BG_COLOR_TOKEN: 'primary',
            DISPLAY: 'LINE',
          },
        ],
      });

      if (!result) {
        responseData.message = 'Invalid send message';

        return responseData;
      }

      responseData.status = true;
      responseData.message = result.toString();

      return responseData;
    } catch (e) {
      this.logger.error(e);
      throw e;
    }
  }
}
