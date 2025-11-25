import { QUEUE_NAMES, QUEUE_TASKS } from '@/modules/queue/queue.constants';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import {
  QueueProcessorResponse,
  QueueProcessorStatus,
} from '@/modules/queue/interfaces/queue-consumer.interface';
import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { AvitoCreateLeadDto } from '@/modules/bitirx/modules/integration/avito/dtos/avito-create-lead.dto';
import { IntegrationAvitoDistributeLeadFromAvito } from '@/modules/bitirx/modules/integration/avito/interfaces/avito-distribute-lead-from-avito.interface';
import { BitrixIntegrationAvitoService } from '@/modules/bitirx/modules/integration/avito/avito.service';
import { BitrixImBotService } from '@/modules/bitirx/modules/imbot/imbot.service';
import { WikiService } from '@/modules/wiki/wiki.service';
import { BitrixTaskService } from '@/modules/bitirx/modules/task/task.service';
import { B24TaskExtended } from '@/modules/bitirx/modules/task/interfaces/task.interface';

@Processor(QUEUE_NAMES.QUEUE_BITRIX_MIDDLE, { concurrency: 3 })
export class QueueBitrixMiddleProcessor extends WorkerHost {
  private readonly logger = new Logger(QueueBitrixMiddleProcessor.name);

  constructor(
    private readonly bitrixIntegrationAvitoService: BitrixIntegrationAvitoService,
    private readonly bitrixImBotService: BitrixImBotService,
    private readonly wikiService: WikiService,
    private readonly bitrixTaskService: BitrixTaskService,
  ) {
    super();
  }

  /* ==================== CONSUMERS ==================== */
  async process(job: Job): Promise<QueueProcessorResponse> {
    const { name, data } = job;
    const response: QueueProcessorResponse = {
      message: '',
      status: QueueProcessorStatus.OK,
      data: null,
    };

    switch (name) {
      case QUEUE_TASKS.MIDDLE
        .QUEUE_BX_INTEGRATION_AVITO_HANDLE_CLIENT_REQUEST_FROM_AVITO:
        response.data = await this.handleTaskClientRequestFromAvito(
          data as AvitoCreateLeadDto,
        );
        break;

      case QUEUE_TASKS.MIDDLE.QUEUE_BX_TASK_UPDATE:
        response.data =
          await this.bitrixTaskService.handleObserveEndSmmAdvertLayoutsTaskUpdate(
            data as B24TaskExtended,
          );
        break;

      default:
        this.logger.warn(`not handled yet: ${name}`);
        response.message = 'Not handled';
        response.status = QueueProcessorStatus.NOT_HANDLED;
    }

    return response;
  }

  private async handleTaskClientRequestFromAvito(fields: AvitoCreateLeadDto) {
    return this.bitrixIntegrationAvitoService.distributeClientRequestFromAvito(
      fields,
    );
  }

  /* ==================== EVENTS LISTENERS ==================== */
  @OnWorkerEvent('completed')
  onCompleted({ name, returnvalue }: Job) {
    switch (name) {
      case QUEUE_TASKS.MIDDLE
        .QUEUE_BX_INTEGRATION_AVITO_HANDLE_CLIENT_REQUEST_FROM_AVITO:
        const { data } =
          returnvalue as QueueProcessorResponse<IntegrationAvitoDistributeLeadFromAvito>;

        this.wikiService.sendResultReceiveClientRequestFromAvitoToWiki({
          wiki_lead_id: data.wiki_lead_id,
          lead_id: data.lead_id,
          status: data.status,
        });
        break;
    }
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job) {
    this.bitrixImBotService.sendTestMessage(
      `Ошибка выполнения задачи: ` + JSON.stringify(job),
    );
  }
}
