import { Controller, Get, Redirect } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { BitrixUseCase } from '@/modules/bitrix/application/use-cases/common/bitrix.use-case';

@ApiExcludeController()
@Controller()
export class AppController {
  constructor(private bitrixService: BitrixUseCase) {}

  @Get()
  @Redirect('/api', 301)
  async main() {}

  @Get('/health')
  async getStatus() {
    return { status: 'ok' };
  }

  @Get('/test')
  async test() {
    return this.bitrixService.callBatch({
      get_advert_deal: {
        method: 'crm.deal.list',
        params: {
          filter: {
            ID: '55368',
          },
          select: ['ID', 'UF_CRM_1716383143'],
        },
      },
      create_task: {
        method: 'tasks.task.add',
        params: {
          fields: {
            TITLE: 'test task',
            DESCRIPTION: 'test $result[get_advert_deal][0][UF_CRM_1716383143]',
            RESPONSIBLE_ID: '376',
            CREATED_BY: '460',
          },
        },
      },
    });
  }
}
