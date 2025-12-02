import { QUEUE_NAMES, QUEUE_TASKS } from '@/modules/queue/queue.constants';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import {
  QueueProcessorResponse,
  QueueProcessorStatus,
} from '@/modules/queue/interfaces/queue-consumer.interface';
import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { BitrixHeadHunterService } from '@/modules/bitirx/modules/integration/headhunter/headhunter.service';
import { HeadhunterWebhookCallDto } from '@/modules/bitirx/modules/integration/headhunter/dto/headhunter-webhook-call.dto';
import { BitrixImBotService } from '@/modules/bitirx/modules/imbot/imbot.service';

@Processor(QUEUE_NAMES.QUEUE_BITRIX_HEAVY, { concurrency: 1 })
export class QueueBitrixHeavyProcessor extends WorkerHost {
  private readonly logger = new Logger(QueueBitrixHeavyProcessor.name);

  constructor(
    private readonly bitrixHeadhunterIntegrationService: BitrixHeadHunterService,
    private readonly bitrixImBotService: BitrixImBotService,
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
    const response: QueueProcessorResponse = {
      message: '',
      status: QueueProcessorStatus.OK,
      data: null,
    };

    switch (name) {
      case QUEUE_TASKS.HEAVY.QUEUE_BX_HANDLE_WEBHOOK_FROM_HH:
        response.message = 'handle new webhook from hh.ru';
        response.data =
          await this.bitrixHeadhunterIntegrationService.handleNewResponseVacancyWebhook(
            data as HeadhunterWebhookCallDto,
          );
        break;

      default:
        this.logger.warn(`not handled yet: ${name}`);
        response.message = 'Not handled';
        response.status = QueueProcessorStatus.NOT_HANDLED;
        break;
    }

    return response;
  }

  /* ==================== EVENTS LISTENERS ==================== */
  @OnWorkerEvent('completed')
  onCompleted({ name, returnvalue, id }: Job) {
    this.bitrixImBotService.sendTestMessage(
      `[b]Задача [${name}][${id}] выполнена:[/b][br]` +
        JSON.stringify(returnvalue),
    );
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job) {
    this.bitrixImBotService.sendTestMessage(
      `Ошибка выполнения задачи: ` + JSON.stringify(job),
    );
  }
}
