import { Injectable } from '@nestjs/common';
import { BitrixService } from '../../bitrix.service';
import { ImbotRegisterCommandDto } from './dtos/imbot-register-command.dto';
import { ImbotUnregisterCommandDto } from './dtos/imbot-unregister-command.dto';
import { B24ImbotSendMessageOptions } from './imbot.interface';

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
}
