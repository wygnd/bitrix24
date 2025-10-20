import { Injectable } from '@nestjs/common';
import { OnImCommandAddDto } from './events.dto';
import { NotifyConvertedDeal } from './interfaces/events-handle.interface';
import { BitrixService } from '../../bitrix.service';
import { B24BatchCommands } from '../../interfaces/bitrix.interface';

@Injectable()
export class BitrixEventService {
  constructor(private readonly bitrixService: BitrixService) {}

  async handleEvent(eventData: OnImCommandAddDto) {
    const { event, data } = eventData;

    if (event !== 'ONIMCOMMANDADD') throw new Error('Invalid event');

    const { MESSAGE } = data.PARAMS;

    const [command] = MESSAGE.split(' ', 2);

    switch (command) {
      case '/choiceManagerForNewDeal':
        return {
          message: 'Was handled',
          status: await this.notifyAboutConvertedDeal(eventData),
        };

      default:
        return {
          message: 'Unknown command',
          status: true,
        };
    }
  }

  async notifyAboutConvertedDeal(eventData: OnImCommandAddDto) {
    const { MESSAGE, MESSAGE_ID } = eventData.data.PARAMS;
    const [, fields] = MESSAGE.split(' ', 2);
    const { dealId, isFits } = JSON.parse(fields) as NotifyConvertedDeal;

    const commands: B24BatchCommands = {
      update_message: {
        method: 'im.message.update',
        params: {
          MESSAGE_ID: MESSAGE_ID,
          MESSAGE: '[b]Обработано[/b][br][br]' + MESSAGE,
          KEYBOARD: [],
        },
      },
    };

    if (isFits) {
      commands['send_message'] = {
        method: 'im.message.add',
        params: {
          DIALOG_ID: '220', // Ирина Новолоцкая
          MESSAGE:
            `Сделка завершена. Проект менеджер отметил, ` +
            `что сайт соответствует тербониям для кейса[br][br]` +
            this.bitrixService.generateDealUrl(dealId),
        },
      };
    }

    await this.bitrixService.callBatch(commands);
    return true;
  }
}
