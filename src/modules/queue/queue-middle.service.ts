import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { QUEUE_NAMES, QUEUE_TASKS } from '@/modules/queue/queue.constants';
import { Queue } from 'bullmq';
import { JobsOptions } from 'bullmq';
import { AvitoCreateLeadDto } from '@/modules/bitirx/modules/integration/avito/dtos/avito-create-lead.dto';

@Injectable()
export class QueueMiddleService {
  constructor(
    @InjectQueue(QUEUE_NAMES.QUEUE_BITRIX_MIDDLE)
    private queueBitrixMiddle: Queue,
  ) {}

  async addTaskForDistributeClientRequestFromAvito(
    data: AvitoCreateLeadDto,
    options?: JobsOptions,
  ) {
    return this.queueBitrixMiddle.add(
      QUEUE_TASKS.MIDDLE
        .QUEUE_BX_INTEGRATION_AVITO_HANDLE_CLIENT_REQUEST_FROM_AVITO,
      data,
      options,
    );
  }
}
