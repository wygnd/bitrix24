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
import { BitrixLeadService } from '@/modules/bitirx/modules/lead/services/lead.service';
import { LeadObserveManagerCallingDto } from '@/modules/bitirx/modules/lead/dtos/lead-observe-manager-calling.dto';

@Processor(QUEUE_NAMES.QUEUE_BITRIX_HEAVY, { concurrency: 1 })
export class QueueBitrixHeavyProcessor extends WorkerHost {
  private readonly logger = new Logger(QueueBitrixHeavyProcessor.name);

  constructor(
    private readonly bitrixHeadhunterIntegrationService: BitrixHeadHunterService,
    private readonly bitrixImBotService: BitrixImBotService,
    private readonly bitrixLeadService: BitrixLeadService,
  ) {
    super();
  }

  /* ==================== CONSUMERS ==================== */
  async process(job: Job): Promise<QueueProcessorResponse> {
    const { name, data, id } = job;
    this.bitrixImBotService.sendTestMessage(
      `[b]Добавлена задача [${name}][${id}] в очередь:[/b][br]`,
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

      case QUEUE_TASKS.HEAVY.QUEUE_BX_HANDLE_OBSERVE_MANAGER_CALLING:
        response.message = 'handle observe manager calling task';
        response.data =
          await this.bitrixLeadService.handleObserveManagerCalling(
            data as LeadObserveManagerCallingDto,
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

  @OnWorkerEvent('closed')
  onClosed(job: Job) {
    const { name, id, stacktrace, failedReason } = job;
    const message = `[b]Закрытие задачи [${name}][${id}]: ${failedReason}[/b][br]>>${stacktrace.join('>>[br]')}`;

    this.bitrixImBotService.sendTestMessage(message);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error) {
    const { name, id, stacktrace, failedReason } = job;
    const message =
      `[b]Ошибка выполнения задачи [${name}][${id}]: ${failedReason}[/b][br]>>${stacktrace.join('>>[br]')}[br][br]` +
      error.message;

    this.bitrixImBotService.sendTestMessage(message);
  }

  @OnWorkerEvent('error')
  onError(error: Error) {
    const message = `[b]Ошибка выполнения задачи:[b][br]${error.message}`;

    this.bitrixImBotService.sendTestMessage(message);
  }
}
