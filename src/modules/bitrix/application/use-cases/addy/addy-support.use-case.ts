import { Injectable } from '@nestjs/common';
import { WinstonLogger } from '@/config/winston.logger';
import { BitrixAddySupportOptions } from '@/common/interfaces/bitrix-config.interface';
import { ConfigService } from '@nestjs/config';
import { BitrixBotUseCase } from '@/modules/bitrix/application/use-cases/bot/bot.use-case';
import {
  BitrixAddySupportSendMessageOptions,
  BitrixAddySupportSendMessageResponse,
} from '@/modules/bitrix/application/interfaces/addy/addy-support-send-message.interface';

@Injectable()
export class BitrixAddySupportUseCase {
  private readonly logger = new WinstonLogger(
    BitrixAddySupportUseCase.name,
    'bitrix:addy:support'.split(':'),
  );
  private readonly supportOptions: BitrixAddySupportOptions;

  constructor(
    private readonly configService: ConfigService,
    private readonly bitrixBot: BitrixBotUseCase,
  ) {
    const addySupportOptions = this.configService.get<BitrixAddySupportOptions>(
      'bitrixConstants.ADDY.support',
    );

    if (
      !addySupportOptions ||
      Object.values(addySupportOptions).filter((v) => !v).length > 0
    )
      throw new Error(
        `${BitrixAddySupportUseCase.name.toUpperCase()}: Invalid config`,
      );

    this.supportOptions = addySupportOptions;
  }

  /**
   * Send message to support addy chat in bitrix
   *
   * ---
   *
   * Отправляет сообщение в чат: ADDY сообщения тех. поддержки
   * @param fields
   */
  public async sendMessage(
    fields: BitrixAddySupportSendMessageOptions,
  ): Promise<BitrixAddySupportSendMessageResponse> {
    const responseData: BitrixAddySupportSendMessageResponse = {
      status: false,
      message: 'Not handle',
    };
    try {
      const { user_id, message } = fields;

      if (user_id == '1') {
        responseData.status = true;
        responseData.message = 'Hide handle';
        return responseData;
      }

      const messageId = await this.bitrixBot.sendMessage({
        DIALOG_ID: this.supportOptions.bitrixChatId,
        MESSAGE: `ID пользователя: ${user_id}[br]Сообщение: ${message}`,
      });

      if (!messageId) {
        responseData.message = 'Invalid send message';

        return responseData;
      }

      responseData.status = true;
      responseData.message = messageId.toString();
      this.logger.debug(`request: ${fields} => response: ${messageId}`);

      return responseData;
    } catch (e) {
      this.logger.error(e);
      throw e;
    }
  }
}
