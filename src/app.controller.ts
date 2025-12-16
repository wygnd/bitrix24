import {
  Controller,
  Get,
  Redirect,
} from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { BitrixService } from '@/modules/bitrix/bitrix.service';
import { B24BatchCommands } from '@/modules/bitrix/interfaces/bitrix.interface';

@ApiExcludeController()
@Controller()
export class AppController {
  constructor(private readonly bitrixService: BitrixService) {}

  @Get()
  @Redirect('/api', 301)
  async main() {}

  @Get('/health')
  async getStatus() {
    return { status: 'ok' };
  }

  @Get('/test')
  async testHook() {
    const phones = [
      '79535212030',
      '79214451619',
      '79998011796',
      '79535212030',
      '79115154748',
      '79998011796',
      '79115154748',
      '79181237060',
      '79115154748',
      '79535212030',
      '79115154748',
      '79117215931',
      '79998011796',
      '79115154748',
      '79115154748',
      '79115154748',
      '79181237060',
      '79115154748',
      '79535212030',
      '79115154748',
      '79117215931',
      '79115154748',
      '79115154748',
      '79115154748',
      '79115154748',
      '79181237060',
      '79115154748',
      '79535212030',
      '79115154748',
      '79115154748',
      '79115154748',
      '79115154748',
      '79115154748',
      '79181237060',
      '79115154748',
      '79115154748',
      '79115154748',
      '79115154748',
      '79060350980',
      '79032669797',
      '79063932912',
      '79181265403',
      '79265155002',
    ];
    const uniquePhones = new Set<string>();
    phones.forEach((phone) => {
      uniquePhones.add(phone);
    });

    const cmds: B24BatchCommands = {};

    uniquePhones.forEach((phone) => {
      cmds['get_lead_by_phone'] = {
        method: 'crm.duplicate.findbycomm',
        params: {
          type: 'PHONE',
          entity_type: 'LEAD',
          values: [phone],
        },
      };
    });

    return this.bitrixService.callBatch(cmds);
  }
}
