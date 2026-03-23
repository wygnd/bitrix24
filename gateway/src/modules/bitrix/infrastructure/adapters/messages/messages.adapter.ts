import { BitrixMessagesPort } from '@/modules/bitrix/application/ports/messages/messages.port';
import { Inject, Injectable } from '@nestjs/common';
import {
  B24ImRemoveMessage,
  B24ImSendMessage,
  B24ImUpdateMessage,
} from '@/modules/bitrix/application/interfaces/messages/messages.interface';
import {
  B24ImNotifyUserOptions,
  B24ImNotifyUserTypes,
} from '@/modules/bitrix/application/interfaces/messages/messages-notify.inteface';
import { WinstonLogger } from '@/config/winston.logger';
import { B24PORTS } from '@/modules/bitrix/bitrix.constants';
import type { BitrixPort } from '@/modules/bitrix/application/ports/common/bitrix.port';

@Injectable()
export class BitrixMessagesAdapter implements BitrixMessagesPort {
  private readonly logger = new WinstonLogger(
    BitrixMessagesAdapter.name,
    'bitrix:messages'.split(':'),
  );

  constructor(
    @Inject(B24PORTS.BITRIX)
    private readonly bitrixService: BitrixPort,
  ) {}

  /**
   * Send private message from user which create application
   *
   * ---
   *
   * Отправляет сообщение от пользователя, создавшего приложение
   * @param fields
   */
  public async sendPrivateMessage(fields: B24ImSendMessage): Promise<number> {
    try {
      const response = await this.bitrixService.callMethod<
        B24ImSendMessage,
        number
      >('im.message.add', {
        ...fields,
      });

      return response?.result ?? 0;
    } catch (error) {
      this.logger.error(error);
      return 0;
    }
  }

  /**
   * Update message user which create application
   *
   * ---
   *
   * Обновляет сообщение, отправленное пользователем, создавшего приложение
   * @param fields
   */
  public async updateMessage(fields: B24ImUpdateMessage): Promise<boolean> {
    try {
      const response = await this.bitrixService.callMethod<
        B24ImUpdateMessage,
        boolean
      >('im.message.update', fields);

      return response?.result ?? false;
    } catch (error) {
      this.logger.error(error);
      return false;
    }
  }

  /**
   * Remove message user which create application
   *
   * ---
   *
   * Удаляет сообщение, отправленное пользователем, создавшего приложение
   * @param messageId
   */
  public async removeMessage(messageId: number): Promise<boolean> {
    try {
      const response = await this.bitrixService.callMethod<
        B24ImRemoveMessage,
        boolean
      >('im.message.delete', {
        MESSAGE_ID: messageId,
      });

      return response?.result ?? false;
    } catch (error) {
      this.logger.error(error);
      return false;
    }
  }

  /**
   * Add notify user
   *
   * ---
   *
   * Добавляет уведомление для пользователя
   * @param type
   * @param options
   */
  public async notifyUser(
    type: B24ImNotifyUserTypes,
    options: B24ImNotifyUserOptions,
  ): Promise<number | null> {
    try {
      const response = await this.bitrixService.callMethod<
        B24ImNotifyUserOptions,
        number
      >(`im.notify.${type}.add`, options);

      return response?.result ?? null;
    } catch (error) {
      this.logger.error(error);
      return null;
    }
  }
}
