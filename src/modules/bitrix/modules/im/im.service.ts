import { Injectable } from '@nestjs/common';
import { BitrixService } from '../../bitrix.service';
import {
  B24ImRemoveMessage,
  B24ImSendMessage,
  B24ImUpdateMessage,
} from './interfaces/im.interface';

@Injectable()
export class BitrixMessageService {
  constructor(private readonly bitrixService: BitrixService) {}

  async sendPrivateMessage(fields: B24ImSendMessage) {
    return this.bitrixService.callMethod<B24ImSendMessage, number>(
      'im.message.add',
      {
        ...fields,
      },
    );
  }

  async updateMessage(fields: B24ImUpdateMessage) {
    return this.bitrixService.callMethod<B24ImUpdateMessage, boolean>(
      'im.message.update',
      fields,
    );
  }

  async removeMessage(messageId: number) {
    return this.bitrixService.callMethod<B24ImRemoveMessage, boolean>(
      'im.message.delete',
      {
        MESSAGE_ID: messageId,
      },
    );
  }
}
