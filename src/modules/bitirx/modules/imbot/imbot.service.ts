import { Injectable } from '@nestjs/common';
import { BitrixService } from '../../bitrix.service';
import { ImbotRegisterCommandDto } from './dtos/imbot-register-command.dto';
import { ImbotUnregisterCommandDto } from './dtos/imbot-unregister-command.dto';
import {
  B24ImbotRegisterOptions,
  B24ImbotSendMessageOptions,
  B24ImbotUnRegisterOptions,
} from './imbot.interface';
import {
  OnImCommandAddDto,
  OnImCommandKeyboardDto,
} from '@/modules/bitirx/modules/imbot/dtos/events.dto';
import { NotifyConvertedDeal } from '@/modules/bitirx/modules/imbot/interfaces/imbot-events-handle.interface';
import { B24BatchCommands } from '@/modules/bitirx/interfaces/bitrix.interface';
import { B24BatchResponseMap } from '@/modules/bitirx/interfaces/bitrix-api.interface';

@Injectable()
export class BitrixImBotService {
  constructor(private readonly bitrixService: BitrixService) {}

  async addCommand(fields: ImbotRegisterCommandDto) {
    return await this.bitrixService.callMethod<ImbotRegisterCommandDto, number>(
      'imbot.command.register',
      {
        ...fields,
      },
    );
  }

  async removeCommand(fields: ImbotUnregisterCommandDto) {
    return await this.bitrixService.callMethod<
      ImbotUnregisterCommandDto,
      boolean
    >('imbot.command.unregister', fields);
  }

  async sendMessage(fields: B24ImbotSendMessageOptions) {
    return await this.bitrixService.callMethod<
      B24ImbotSendMessageOptions,
      number
    >('imbot.message.add', fields);
  }

  async registerBot(fields: B24ImbotRegisterOptions) {
    return this.bitrixService.callMethod<B24ImbotRegisterOptions, number>(
      'imbot.register',
      fields,
    );
  }

  async unregisterBot(fields: B24ImbotUnRegisterOptions) {
    return this.bitrixService.callMethod<B24ImbotUnRegisterOptions, boolean>(
      'imbot.unregister',
      fields,
    );
  }

  async notifyAboutConvertedDeal(eventData: OnImCommandKeyboardDto) {
    const { MESSAGE, MESSAGE_ID } = eventData.data.PARAMS;
    const [, fields] = MESSAGE.split(' ', 2);
    const { dealId, isFits, oldMessage } = JSON.parse(
      fields,
    ) as NotifyConvertedDeal;

    const commands: B24BatchCommands = {
      update_message: {
        method: 'imbot.message.update',
        params: {
          BOT_ID: this.bitrixService.BOT_ID,
          MESSAGE_ID: MESSAGE_ID,
          MESSAGE:
            `[b]Обработано: ${isFits ? 'Сайт подходит' : 'Сайт не подходит'}[/b][br][br]` +
            Buffer.from(oldMessage).toString('utf8'),
          KEYBOARD: '',
        },
      },
      update_deal: {
        method: 'crm.deal.update',
        params: {
          id: dealId,
          fields: {
            UF_CRM_1760972834021: '1',
          },
        },
      },
    };

    if (isFits) {
      commands['send_message'] = {
        method: 'im.message.add',
        params: {
          DIALOG_ID: 220, // Ирина Новолоцкая
          MESSAGE:
            'Этот сайт соответствует требованиям для кейса[br]Сделка: ' +
            this.bitrixService.generateDealUrl(dealId),
        },
      };
    }

    const response = await this.bitrixService.callBatch<
      B24BatchResponseMap<{
        update_message: boolean;
        send_message: number;
        update_deal: boolean;
      }>
    >(commands);

    const errors = Object.values(response.result.result_error);
    if (errors.length !== 0) {
      const message = errors.reduce((acc, { error, error_description }) => {
        acc += `${error}---${error_description}|||`;
        return acc;
      }, '');
      throw new Error(`Invalid on batch request: ${message}`);
    }

    return true;
  }

  async distributeNewDeal(eventData: OnImCommandKeyboardDto) {}
}
