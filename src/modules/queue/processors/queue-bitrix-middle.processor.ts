import { QUEUE_NAMES, QUEUE_TASKS } from '@/modules/queue/queue.constants';
import { Job } from 'bullmq';
import {
  QueueProcessorResponse,
  QueueProcessorStatus,
} from '@/modules/queue/interfaces/queue-consumer.interface';
import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { AvitoCreateLeadDto } from '@/modules/bitrix/application/dtos/avito/avito-create-lead.dto';
import { IntegrationAvitoDistributeLeadFromAvito } from '@/modules/bitrix/application/interfaces/avito/avito-distribute-lead-from-avito.interface';
import { WikiService } from '@/modules/wiki/wiki.service';
import { B24TaskExtended } from '@/modules/bitrix/application/interfaces/tasks/tasks.interface';
import { WinstonLogger } from '@/config/winston.logger';
import { BitrixTasksUseCase } from '@/modules/bitrix/application/use-cases/tasks/tasks.use-case';
import { BitrixAvitoUseCase } from '@/modules/bitrix/application/use-cases/avito/avito.use-case';

@Processor(QUEUE_NAMES.QUEUE_BITRIX_MIDDLE, { concurrency: 3 })
export class QueueBitrixMiddleProcessor extends WorkerHost {
  private readonly logger = new WinstonLogger(
    QueueBitrixMiddleProcessor.name,
    'queue:handle'.split(':'),
  );

  constructor(
    private readonly bitrixAvito: BitrixAvitoUseCase,
    private readonly wikiService: WikiService,
    private readonly bitrixTasks: BitrixTasksUseCase,
  ) {
    super();
  }

  /* ==================== CONSUMERS ==================== */
  async process(job: Job): Promise<QueueProcessorResponse> {
    const { name, data, id } = job;

    this.logger.debug({
      message: `Добавлена задача [${name}][${id}] в очередь`,
      data,
    });

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
          await this.bitrixTasks.handleObserveEndSmmAdvertLayoutsTaskUpdate(
            data as B24TaskExtended,
          );
        break;

      default:
        this.logger.warn(`not handled yet: ${name}`);
        response.message = 'Not handled';
        response.status = QueueProcessorStatus.NOT_HANDLED;
    }

    this.logger.debug({
      message: 'check result run task',
      response,
    });

    return response;
  }

  private async handleTaskClientRequestFromAvito(fields: AvitoCreateLeadDto) {
    return this.bitrixAvito.distributeClientRequestFromAvito(fields);
  }

  /* ==================== EVENTS LISTENERS ==================== */
  @OnWorkerEvent('completed')
  onCompleted({ name, returnvalue: response, id }: Job) {
    this.logger.debug({
      message: `Задача [${name}][${id}] выполнена`,
      response,
    });

    switch (name) {
      case QUEUE_TASKS.MIDDLE
        .QUEUE_BX_INTEGRATION_AVITO_HANDLE_CLIENT_REQUEST_FROM_AVITO:
        const { data } =
          response as QueueProcessorResponse<IntegrationAvitoDistributeLeadFromAvito>;

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
    this.logger.error({ job });
  }
}
