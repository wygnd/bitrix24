import { Injectable } from '@nestjs/common';
import { OnImCommandAddDto } from './events.dto';
import { NotifyConvertedDeal } from './interfaces/events-handle.interface';
import { BitrixService } from '../../bitrix.service';
import { BitrixMessageService } from '../im/im.service';

@Injectable()
export class BitrixEventService {
  constructor(
    private readonly bitrixService: BitrixService,
    private readonly bitrixMessageService: BitrixMessageService,
  ) {}

  async handleEvent(eventData: OnImCommandAddDto) {
    const { event, data } = eventData;

    if (event !== 'ONIMCOMMANDADD') throw new Error('Invalid event');

    const { MESSAGE } = data.PARAMS;

    const [command, fields] = MESSAGE.split(' ', 2);

    switch (command) {
      case '/choiceManagerForNewDeal':
        return await this.notifyAboutConvertedDeal(fields);

      default:
        return {
          message: 'Unknown command',
          status: true,
        };
    }
  }

  async notifyAboutConvertedDeal(fields: string) {
    const { dealId, isFits } = JSON.parse(fields) as NotifyConvertedDeal;

    if (!isFits) return;

    await this.bitrixMessageService.sendPrivateMessage({
      DIALOG_ID: '220', // Ирина Новолоцкая
      MESSAGE:
        `Сделка завершена. Проект менеджер отметил, ` +
        `что сайт соответствует тербониям для кейса[br][br]` +
        this.bitrixService.generateDealUrl(dealId),
    });
  }
}
