import { Injectable } from '@nestjs/common';
import { BitrixService } from '../../bitrix.service';
import { SendMessageDto } from './dtos/im.dto';
import { B24ImSendMessage } from './im.interface';

@Injectable()
export class BitrixMessageService {
  constructor(private readonly bitrixService: BitrixService) {}

  async sendPrivateMessage(fields: B24ImSendMessage) {
    return await this.bitrixService.callMethod<B24ImSendMessage, number>(
      'im.message.add',
      {
        ...fields,
      },
    );
  }
}
