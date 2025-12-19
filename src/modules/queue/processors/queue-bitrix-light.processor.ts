import { QUEUE_NAMES, QUEUE_TASKS } from '@/modules/queue/queue.constants';
import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import {
  QueueProcessorResponse,
  QueueProcessorStatus,
} from '@/modules/queue/interfaces/queue-consumer.interface';
import { WikiService } from '@/modules/wiki/wiki.service';
import { BitrixImBotService } from '@/modules/bitrix/modules/imbot/imbot.service';
import { WinstonLogger } from '@/config/winston.logger';
import { BitrixLeadUpsellService } from '@/modules/bitrix/modules/lead/services/lead-upsell.service';
import { QueueLightAddTaskHandleUpsellDeal } from '@/modules/queue/interfaces/queue-light.interface';
import { BitrixWebhookService } from '@/modules/bitrix/modules/webhook/webhook.service';
import { B24WebhookVoxImplantCallStartOptions } from '@/modules/bitrix/modules/webhook/interfaces/webhook-voximplant-calls.interface';

@Processor(QUEUE_NAMES.QUEUE_BITRIX_LIGHT, { concurrency: 10 })
export class QueueBitrixLightProcessor extends WorkerHost {
  private readonly logger = new WinstonLogger(QueueBitrixLightProcessor.name, [
    'queue',
    'handle',
  ]);

  constructor(
    private readonly wikiService: WikiService,
    private readonly bitrixImBotService: BitrixImBotService,
    private readonly bitrixLeadUpsellService: BitrixLeadUpsellService,
    private readonly bitrixWebhookService: BitrixWebhookService,
  ) {
    super();
  }

  /* ==================== CONSUMERS ==================== */
  async process(job: Job): Promise<QueueProcessorResponse> {
    const { name, data, id } = job;
    this.bitrixImBotService
      .sendTestMessage(
        `[b]Добавлена задача [${name}][${id}] в очередь:[/b][br]` +
          JSON.stringify(data),
      )
      .catch(() => {});
    this.logger.info({
      message: `Добавлена задача [${name}][${id}] в очередь`,
      data,
    });
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
        response.data = await this.bitrixLeadUpsellService.handleTaskUpsellDeal(
          data as QueueLightAddTaskHandleUpsellDeal,
        );
        break;

      case QUEUE_TASKS.LIGHT.QUEUE_BX_HANDLE_WEBHOOK_VOXIMPLANT_CALL_INIT:
        response.data =
          await this.bitrixWebhookService.handleVoxImplantCallStart(
            data as B24WebhookVoxImplantCallStartOptions,
          );
        break;

      default:
        this.logger.warn(`not handled yet: ${name}`);
        response.message = 'Not handled';
        response.status = QueueProcessorStatus.NOT_HANDLED;
        break;
    }

    this.logger.info({
      message: 'check result run task',
      response,
    });

    return response;
  }

  /* ==================== EVENTS LISTENERS ==================== */
  @OnWorkerEvent('completed')
  onCompleted({ name, returnvalue: response, id }: Job) {
    this.bitrixImBotService.sendTestMessage(
      `[b]Задача [${name}][${id}] выполнена:[/b][br]` +
        JSON.stringify(response),
    );
    this.logger.info({
      message: `Задача [${name}][${id}] выполнена`,
      response,
    });
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job) {
    this.bitrixImBotService.sendTestMessage(
      `[b]Ошибка выполнения задачи:[/b][br] ` + JSON.stringify(job),
    );

    this.logger.error({ message: 'Ошибка выполнения задачи', job });
  }
}
