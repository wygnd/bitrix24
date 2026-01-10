import { Inject, Injectable } from '@nestjs/common';
import type { BitrixMessagesPort } from '@/modules/bitrix/application/ports/messages/messages.port';
import { B24PORTS } from '@/modules/bitrix/bitrix.constants';
import { B24ImSendMessage } from '@/modules/bitrix/application/interfaces/messages/messages.interface';

@Injectable()
export class BitrixMessagesUseCase {
  constructor(
    @Inject(B24PORTS.MESSAGES.MESSAGES_DEFAULT)
    private readonly bitrixMessages: BitrixMessagesPort,
  ) {}

  async sendPrivateMessage(fields: B24ImSendMessage) {
    return this.bitrixMessages.sendPrivateMessage(fields);
  }


}
