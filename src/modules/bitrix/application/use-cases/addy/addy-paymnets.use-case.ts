import { Inject, Injectable } from '@nestjs/common';
import { B24PORTS } from '@/modules/bitrix/bitrix.constants';
import type { BitrixPort } from '@/modules/bitrix/application/ports/common/bitrix.port';
import {
  BitrixAddyPaymentsSendMessageOptions,
  BitrixAddyPaymentsSendMessageResponse,
} from '@/modules/bitrix/application/interfaces/addy/addy-payments-send-message.interface';
import { WinstonLogger } from '@/config/winston.logger';
import type { BitrixBotPort } from '@/modules/bitrix/application/ports/bot/bot.port';
import { BitrixAddyPaymentOptions } from '@/common/interfaces/bitrix-config.interface';
import { ConfigService } from '@nestjs/config';
import {
  B24ImboKeyboardAddyPaymentsApprove
} from '@/modules/bitrix/application/interfaces/bot/imbot-keyboard-addy-payments-approve.interface';

@Injectable()
export class BitrixAddyPaymentsUseCase {
  private readonly logger = new WinstonLogger(
    BitrixAddyPaymentsUseCase.name,
    'bitrix:addy:payments'.split(':'),
  );
  private readonly paymentOptions: BitrixAddyPaymentOptions;

  constructor(
    private readonly configService: ConfigService,
    @Inject(B24PORTS.BITRIX)
    private readonly bitrixService: BitrixPort,
    @Inject(B24PORTS.BOT.BOT_DEFAULT)
    private readonly bitrixBot: BitrixBotPort,
  ) {
    const addySupportOptions = this.configService.get<BitrixAddyPaymentOptions>(
      'bitrixConstants.ADDY.payment',
    );

    if (
      !addySupportOptions ||
      Object.values(addySupportOptions).filter((v) => !v).length > 0
    )
      throw new Error(
        `${BitrixAddyPaymentsUseCase.name.toUpperCase()}: Invalid config`,
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

      const messageId = await this.bitrixBot.sendMessage({
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
              message: this.bitrixBot.encodeText(
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

      if (!messageId) {
        responseData.message = 'Invalid send message';

        return responseData;
      }

      responseData.status = true;
      responseData.message = messageId.toString();

      return responseData;
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }
}
