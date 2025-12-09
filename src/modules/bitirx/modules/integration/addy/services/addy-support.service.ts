import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BitrixAddySupportOptions } from '@/common/interfaces/bitrix-config.interface';
import {
  BitrixAddySupportSendMessageOptions,
  BitrixAddySupportSendMessageResponse,
} from '@/modules/bitirx/modules/integration/addy/interfaces/addy-support-send-message.interface';
import { BitrixImBotService } from '@/modules/bitirx/modules/imbot/imbot.service';
import { WinstonLogger } from '@/config/winston.logger';

@Injectable()
export class BitrixAddySupportService {
  private readonly logger = new WinstonLogger(BitrixAddySupportService.name, [
    'addy',
  ]);
  private readonly supportOptions: BitrixAddySupportOptions;

  constructor(
    private readonly configService: ConfigService,
    private readonly bitrixImbotService: BitrixImBotService,
  ) {
    const addySupportOptions = this.configService.get<BitrixAddySupportOptions>(
      'bitrixConstants.ADDY.support',
    );

    if (
      !addySupportOptions ||
      Object.values(addySupportOptions).filter((v) => !v).length > 0
    )
      throw new Error(
        `${BitrixAddySupportService.name.toUpperCase()}: Invalid config`,
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

      const { result } = await this.bitrixImbotService.sendMessage({
        DIALOG_ID: this.supportOptions.bitrixChatId,
        MESSAGE: `ID пользователя: ${user_id}[br]Сообщение: ${message}`,
      });

      if (!result) {
        responseData.message = 'Invalid send message';

        return responseData;
      }

      responseData.status = true;
      responseData.message = result.toString();
      this.logger.info(`request: ${fields} => response: ${result}`);

      return responseData;
    } catch (e) {
      this.logger.error(e);
      responseData.message = e;

      return responseData;
    }
  }
}
