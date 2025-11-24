import { QUEUE_NAMES, QUEUE_TASKS } from '@/modules/queue/queue.constants';
import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import {
  QueueProcessorResponse,
  QueueProcessorStatus,
} from '@/modules/queue/interfaces/queue-consumer.interface';
import { AvitoCreateLeadDto } from '@/modules/bitirx/modules/integration/avito/dtos/avito-create-lead.dto';
import { BitrixIntegrationAvitoService } from '@/modules/bitirx/modules/integration/avito/avito.service';
import { IntegrationAvitoDistributeLeadFromAvito } from '@/modules/bitirx/modules/integration/avito/interfaces/avito-distribute-lead-from-avito.interface';

@Processor(QUEUE_NAMES.QUEUE_BITRIX_LIGHT)
export class QueueBitrixLightProcessor extends WorkerHost {
  private readonly logger = new Logger(QueueBitrixLightProcessor.name);

  constructor(
    private readonly bitrixIntegrationAvitoService: BitrixIntegrationAvitoService,
  ) {
    super();
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    this.logger.debug(`Job Completed: ${job.returnvalue}`);
  }

  async process(job: Job): Promise<QueueProcessorResponse> {
    this.logger.debug(`processing task 2: ${job.name}, ${job.data}`);

    const { name, data } = job;

    switch (name) {
      case QUEUE_TASKS.QUEUE_BX_INTEGRATION_AVITO_HANDLE_CLIENT_REQUEST_FROM_AVITO:
        return this.handleTaskClientRequestFromAvito(
          data as AvitoCreateLeadDto,
        );

      case QUEUE_TASKS.QUEUE_BX_TEST:
        this.logger.warn('not handled yet');
        break;
    }

    return {
      message: 'Not handled',
      status: QueueProcessorStatus.OK,
      data: null,
    } as QueueProcessorResponse<null>;
  }

  private async handleTaskClientRequestFromAvito(
    fields: AvitoCreateLeadDto,
  ): Promise<QueueProcessorResponse<IntegrationAvitoDistributeLeadFromAvito>> {
    return {
      message: 'Success',
      status: QueueProcessorStatus.OK,
      data: await this.bitrixIntegrationAvitoService.distributeClientRequestFromAvito(
        fields,
      ),
    };
  }
}
