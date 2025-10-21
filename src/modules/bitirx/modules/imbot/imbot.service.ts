import { Injectable } from '@nestjs/common';
import { BitrixService } from '../../bitrix.service';
import { ImbotRegisterCommandDto } from './dtos/imbot-register-command.dto';
import { ImbotUnregisterCommandDto } from './dtos/imbot-unregister-command.dto';
import {
  B24ImbotRegisterOptions,
  B24ImbotSendMessageOptions,
  B24ImbotUnRegisterOptions,
} from './imbot.interface';

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
}
