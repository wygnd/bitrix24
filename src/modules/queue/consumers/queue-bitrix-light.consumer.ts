import { QUEUE_NAMES, QUEUE_TASKS } from '@/modules/queue/queue.constants';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import {
  QueueConsumerResponse,
  QueueConsumerStatus,
} from '@/modules/queue/interfaces/queue-consumer.interface';
import { AvitoCreateLeadDto } from '@/modules/bitirx/modules/integration/avito/dtos/avito-create-lead.dto';

@Processor(QUEUE_NAMES.QUEUE_BITRIX_LIGHT)
export class QueueBitrixLightConsumer extends WorkerHost {
  private readonly logger = new Logger(QueueBitrixLightConsumer.name);

  async process(job: Job) {
    this.logger.debug(`processing task: ${job.name}, ${job.data}`);

    const { name, data } = job;

    switch (name) {
      case QUEUE_TASKS.QUEUE_BX_INTEGRATION_AVITO_HANDLE_CLIENT_REQUEST_FROM_AVITO:
        return this.handleTaskClientRequestFromAvito(data as AvitoCreateLeadDto)


      case QUEUE_TASKS.QUEUE_BX_TASK_UPDATE:
        break;
    }

    return {
      message: 'Is not handled',
      status: QueueConsumerStatus.OK,
      data: null,
    } as QueueConsumerResponse<null>;
  }

  private async handleTaskClientRequestFromAvito(fields: AvitoCreateLeadDto) {

  }
}
