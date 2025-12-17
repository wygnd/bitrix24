import { Injectable } from '@nestjs/common';
import { BitrixService } from '../../bitrix.service';
import {
  B24ImRemoveMessage,
  B24ImSendMessage,
  B24ImUpdateMessage,
} from './interfaces/im.interface';
import { B24ImNotifyUserOptions } from '@/modules/bitrix/modules/im/interfaces/im-notify.inteface';
import { WinstonLogger } from '@/config/winston.logger';

@Injectable()
export class BitrixMessageService {
  private readonly logger = new WinstonLogger(
    BitrixMessageService.name,
    'bitrix:services'.split(':'),
  );

  constructor(private readonly bitrixService: BitrixService) {}

  public async sendPrivateMessage(fields: B24ImSendMessage) {
    return this.bitrixService.callMethod<B24ImSendMessage, number>(
      'im.message.add',
      {
        ...fields,
      },
    );
  }

  public async updateMessage(fields: B24ImUpdateMessage) {
    return this.bitrixService.callMethod<B24ImUpdateMessage, boolean>(
      'im.message.update',
      fields,
    );
  }

  public async removeMessage(messageId: number) {
    return this.bitrixService.callMethod<B24ImRemoveMessage, boolean>(
      'im.message.delete',
      {
        MESSAGE_ID: messageId,
      },
    );
  }

  public async notifyUser(
    type: 'system' | 'personal' = 'personal',
    options: B24ImNotifyUserOptions,
  ): Promise<number | null> {
    try {
      const { result } = await this.bitrixService.callMethod<
        B24ImNotifyUserOptions,
        number
      >(`im.notify.${type}.add`, options);

      return result ? result : null;
    } catch (error) {
      this.logger.error(error.toString());
      return null;
    }
  }
}
