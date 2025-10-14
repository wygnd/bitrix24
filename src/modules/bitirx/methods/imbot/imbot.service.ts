import { Injectable } from '@nestjs/common';
import { BitrixService } from '../../bitrix.service';
import { ImbotRegisterCommandDto } from './dtos/imbot-register-command.dto';
import { ImbotUnregisterCommandDto } from './dtos/imbot-unregister-command.dto';

@Injectable()
export class BitrixImBotService {
  constructor(private readonly bitrixService: BitrixService) {}

  async addCommand(fields: ImbotRegisterCommandDto) {
    return await this.bitrixService.call<ImbotRegisterCommandDto, number>(
      'imbot.command.register',
      {
        ...fields,
      },
    );
  }

  async removeCommand(fields: ImbotUnregisterCommandDto) {
    return await this.bitrixService.call<ImbotUnregisterCommandDto, boolean>(
      'imbot.command.unregister',
      { ...fields },
    );
  }
}
