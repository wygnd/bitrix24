import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { B24PORTS } from '@/modules/bitrix/bitrix.constants';
import type { BitrixPort } from '@/modules/bitrix/application/ports/common/bitrix.port';
import {
  BitrixAddyPaymentsSendMessageNoticeOptions,
  BitrixAddyPaymentsSendMessagePaymentOptions,
  BitrixAddyPaymentsSendMessageQuery,
  BitrixAddyPaymentsSendMessageResponse,
} from '@/modules/bitrix/application/interfaces/addy/addy-payments-send-message.interface';
import { WinstonLogger } from '@/config/winston.logger';
import type { BitrixBotPort } from '@/modules/bitrix/application/ports/bot/bot.port';
import { BitrixAddyPaymentOptions } from '@/common/interfaces/bitrix-config.interface';
import { ConfigService } from '@nestjs/config';
import { B24ImboKeyboardAddyPaymentsApprove } from '@/modules/bitrix/application/interfaces/bot/imbot-keyboard-addy-payments-approve.interface';
import { validateField } from '@/common/validators/validate-field.validator';
import {
  BitrixAddyPaymentsSendMessageNoticeDTO,
  BitrixAddyPaymentsSendMessagePaymentDto,
} from '@/modules/bitrix/application/dtos/addy/addy-payments-send-message.dto';

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

  /**
   * Distribute handler function by query type parameter
   *
   * ---
   *
   * Распределяет обработку функций отправки сообщения по флагу type
   * @param query
   * @param body
   */
  public async sendMessageByType(
    query: BitrixAddyPaymentsSendMessageQuery,
    body: unknown,
  ) {
    try {
      this.logger.debug({ query, body });
      if (!body)
        throw new BadRequestException('Invalid body fields', {
          cause: body,
        });

      switch (query.type) {
        case 'payment':
          return this.sendPaymentMessage(
            await validateField<BitrixAddyPaymentsSendMessagePaymentOptions>(
              BitrixAddyPaymentsSendMessagePaymentDto,
              body,
            ),
          );

        case 'notice':
          return this.sendNoticeMessage(
            await validateField(BitrixAddyPaymentsSendMessageNoticeDTO, body),
          );

        default:
          throw new BadRequestException('type is not valid property');
      }
    } catch (error) {
      this.logger.error({
        handler: this.sendMessageByType.name,
        body,
        query,
        error,
      });

      throw error;
    }
  }

  /**
   * Send payment message to Addy Pay chat
   *
   * ---
   *
   * Отправляет сообщение о платеже в Addy Pay чат
   * @param fields
   */
  public async sendPaymentMessage(
    fields: BitrixAddyPaymentsSendMessagePaymentOptions,
  ): Promise<BitrixAddyPaymentsSendMessageResponse> {
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

    if (!messageId)
      throw new BadRequestException('Invalid send message', {
        cause: messageId,
      });

    return {
      status: true,
      message: message.toString(),
    };
  }

  /**
   * Send notice message to Addy Pay chat
   *
   * ---
   *
   * Отправляет сообщение в Addy Pay чат
   * @param fields
   */
  public async sendNoticeMessage(
    fields: BitrixAddyPaymentsSendMessageNoticeOptions,
  ): Promise<BitrixAddyPaymentsSendMessageResponse> {
    const messageId = await this.bitrixBot.sendMessage({
      DIALOG_ID: this.paymentOptions.bitrixChatId,
      MESSAGE: fields.message,
    });

    if (!messageId)
      throw new BadRequestException('Invalid send message', {
        cause: messageId,
      });

    return {
      status: true,
      message: messageId.toString(),
    };
  }
}
