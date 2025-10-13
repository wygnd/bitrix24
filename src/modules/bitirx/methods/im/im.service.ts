import { Injectable } from '@nestjs/common';
import { BitrixService } from '../../bitrix.service';
import { SendMessageDto } from './dtos/im.dto';
import { B24ImSendMessage } from './im.interface';

@Injectable()
export class BitrixMessageService {
  constructor(private readonly bitrixService: BitrixService) {}

  // todo: type response
  async sendPrivateMessage(fields: SendMessageDto) {
    const { dialogId, message } = fields;

    return await this.bitrixService.call<B24ImSendMessage>('im.message.add', {
      DIALOG_ID: dialogId,
      MESSAGE: message,
    });
  }
}
