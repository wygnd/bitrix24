import { QUEUE_NAMES, QUEUE_TASKS } from '@/modules/queue/queue.constants';
import { Job } from 'bullmq';
import {
  QueueProcessorResponse,
  QueueProcessorStatus,
} from '@/modules/queue/interfaces/queue-consumer.interface';
import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { AvitoCreateLeadDto } from '@/modules/bitrix/modules/integration/avito/dtos/avito-create-lead.dto';
import { IntegrationAvitoDistributeLeadFromAvito } from '@/modules/bitrix/modules/integration/avito/interfaces/avito-distribute-lead-from-avito.interface';
import { BitrixIntegrationAvitoService } from '@/modules/bitrix/modules/integration/avito/avito.service';
import { BitrixImBotService } from '@/modules/bitrix/modules/imbot/imbot.service';
import { WikiService } from '@/modules/wiki/wiki.service';
import { B24TaskExtended } from '@/modules/bitrix/application/interfaces/tasks/tasks.interface';
import { WinstonLogger } from '@/config/winston.logger';
import { BitrixTasksUseCase } from '@/modules/bitrix/application/use-cases/tasks/tasks.use-case';

@Processor(QUEUE_NAMES.QUEUE_BITRIX_MIDDLE, { concurrency: 3 })
export class QueueBitrixMiddleProcessor extends WorkerHost {
  private readonly logger = new WinstonLogger(QueueBitrixMiddleProcessor.name, [
    'queue',
    'handle',
  ]);

  constructor(
    private readonly bitrixIntegrationAvitoService: BitrixIntegrationAvitoService,
    private readonly bitrixImBotService: BitrixImBotService,
    private readonly wikiService: WikiService,
    private readonly bitrixTasks: BitrixTasksUseCase,
  ) {
    super();
  }

  /* ==================== CONSUMERS ==================== */
  async process(job: Job): Promise<QueueProcessorResponse> {
    const { name, data, id } = job;
    this.bitrixImBotService.sendTestMessage(
      `[b]Добавлена задача [${name}][${id}] в очередь:[/b][br]` +
        JSON.stringify(data),
    );
    this.logger.debug(
      {
        message: `Добавлена задача [${name}][${id}] в очередь`,
        data,
      },
      true,
    );

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

    this.logger.debug(
      {
        message: 'check result run task',
        response,
      },
      true,
    );

    return response;
  }

  private async handleTaskClientRequestFromAvito(fields: AvitoCreateLeadDto) {
    return this.bitrixIntegrationAvitoService.distributeClientRequestFromAvito(
      fields,
    );
  }

  /* ==================== EVENTS LISTENERS ==================== */
  @OnWorkerEvent('completed')
  onCompleted({ name, returnvalue: response, id }: Job) {
    this.bitrixImBotService.sendTestMessage(
      `[b]Задача [${name}][${id}] выполнена:[/b][br]` +
        JSON.stringify(response),
    );

    this.logger.debug(
      {
        message: `Задача [${name}][${id}] выполнена`,
        response,
      },
      true,
    );

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
    const logMessage = 'Ошибка выполнения задачи';
    this.bitrixImBotService.sendTestMessage(
      `[b]${logMessage}:[/b][br]` + JSON.stringify(job),
    );

    this.logger.error({ message: logMessage, job }, true);
    this.logger.log(
      {
        message: logMessage,
        id: job.id,
        name: job.name,
        reason: job.failedReason,
      },
      'error',
    );
  }
}
