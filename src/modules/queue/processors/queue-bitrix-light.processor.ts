import { QUEUE_NAMES, QUEUE_TASKS } from '@/modules/queue/queue.constants';
import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import {
  QueueProcessorResponse,
  QueueProcessorStatus,
} from '@/modules/queue/interfaces/queue-consumer.interface';
import { WikiService } from '@/modules/wiki/wiki.service';
import { WinstonLogger } from '@/config/winston.logger';
import { QueueLightAddTaskHandleUpsellDeal } from '@/modules/queue/interfaces/queue-light.interface';
import { B24WebhookVoxImplantCallInitTaskOptions } from '@/modules/bitrix/application/interfaces/webhooks/webhook-voximplant-calls.interface';
import { BitrixBotUseCase } from '@/modules/bitrix/application/use-cases/bot/bot.use-case';
import { BitrixLeadsUpsellUseCase } from '@/modules/bitrix/application/use-cases/leads/leads-upsell.use-case';
import { BitrixWebhooksUseCase } from '@/modules/bitrix/application/use-cases/webhooks/webhooks.use-case';

@Processor(QUEUE_NAMES.QUEUE_BITRIX_LIGHT, { concurrency: 10 })
export class QueueBitrixLightProcessor extends WorkerHost {
  private readonly logger = new WinstonLogger(QueueBitrixLightProcessor.name, [
    'queue',
    'handle',
  ]);

  constructor(
    private readonly wikiService: WikiService,
    private readonly bitrixBot: BitrixBotUseCase,
    private readonly bitrixLeadUpsell: BitrixLeadsUpsellUseCase,
    private readonly bitrixWebhooks: BitrixWebhooksUseCase,
  ) {
    super();
  }

  /* ==================== CONSUMERS ==================== */
  async process(job: Job): Promise<QueueProcessorResponse> {
    const { name, data, id } = job;
    this.bitrixBot
      .sendTestMessage(
        `[b]Добавлена задача [${name}][${id}] в очередь:[/b][br]` +
          JSON.stringify(data),
      )
      .catch(() => {});
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
      case QUEUE_TASKS.LIGHT.QUEUE_BX_EVENTS_SEND_WIKI_ON_LEAD_DELETE:
        response.data = await this.wikiService.sendNotifyAboutDeleteLead(
          data as string,
        );
        break;

      case QUEUE_TASKS.LIGHT.QUEUE_BX_HANDLE_UPSELL_DEAL:
        response.data = await this.bitrixLeadUpsell.handleTaskUpsellDeal(
          data as QueueLightAddTaskHandleUpsellDeal,
        );
        break;

      case QUEUE_TASKS.LIGHT.QUEUE_BX_HANDLE_WEBHOOK_VOXIMPLANT_CALL_INIT:
        response.data = await this.bitrixWebhooks.handleVoxImplantCallInit(
          data as B24WebhookVoxImplantCallInitTaskOptions,
        );
        break;

      default:
        this.logger.warn(`not handled yet: ${name}`);
        response.message = 'Not handled';
        response.status = QueueProcessorStatus.NOT_HANDLED;
        break;
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

  /* ==================== EVENTS LISTENERS ==================== */
  @OnWorkerEvent('completed')
  onCompleted({ name, returnvalue: response, id }: Job) {
    this.bitrixBot.sendTestMessage(
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
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job) {
    const logMessage = 'Ошибка выполнения задачи';

    this.logger.error({ message: logMessage, job });
    this.bitrixBot.sendTestMessage(
      `[b]${logMessage}:[/b][br] ` + JSON.stringify(job),
    );
  }
}
