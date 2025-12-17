import { QUEUE_NAMES, QUEUE_TASKS } from '@/modules/queue/queue.constants';
import { Job } from 'bullmq';
import {
  QueueProcessorResponse,
  QueueProcessorStatus,
} from '@/modules/queue/interfaces/queue-consumer.interface';
import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { BitrixHeadHunterService } from '@/modules/bitrix/modules/integration/headhunter/headhunter.service';
import { HeadhunterWebhookCallDto } from '@/modules/bitrix/modules/integration/headhunter/dto/headhunter-webhook-call.dto';
import { BitrixImBotService } from '@/modules/bitrix/modules/imbot/imbot.service';
import { BitrixLeadService } from '@/modules/bitrix/modules/lead/services/lead.service';
import { LeadObserveManagerCallingDto } from '@/modules/bitrix/modules/lead/dtos/lead-observe-manager-calling.dto';
import { WinstonLogger } from '@/config/winston.logger';

@Processor(QUEUE_NAMES.QUEUE_BITRIX_HEAVY, { concurrency: 1 })
export class QueueBitrixHeavyProcessor extends WorkerHost {
  private readonly logger = new WinstonLogger(QueueBitrixHeavyProcessor.name, [
    'queue',
    'handle',
  ]);

  constructor(
    private readonly bitrixHeadhunterIntegrationService: BitrixHeadHunterService,
    private readonly bitrixImBotService: BitrixImBotService,
    private readonly bitrixLeadService: BitrixLeadService,
  ) {
    super();
  }

  /* ==================== CONSUMERS ==================== */
  async process(job: Job): Promise<QueueProcessorResponse> {
    const response: QueueProcessorResponse = {
      message: '',
      status: QueueProcessorStatus.OK,
      data: null,
    };

    try {
      const { name, data, id } = job;
      this.bitrixImBotService.sendTestMessage(
        `[b]Добавлена задача [${name}][${id}] в очередь:[/b][br]`,
      );
      this.logger.info(`Добавлена задача [${name}][${id}] в очередь`);

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
    } catch (e) {
      this.logger.error(e);
      response.message = e;
      response.status = QueueProcessorStatus.INVALID;
      return response;
    }
  }

  /* ==================== EVENTS LISTENERS ==================== */
  @OnWorkerEvent('completed')
  onCompleted({ name, returnvalue, id }: Job) {
    this.bitrixImBotService.sendTestMessage(
      `[b]Задача [${name}][${id}] выполнена:[/b][br]` +
        JSON.stringify(returnvalue),
    );
    this.logger.info(
      `Задача [${name}][${id}] выполнена: ${JSON.stringify(returnvalue)}`,
    );
  }

  @OnWorkerEvent('closed')
  onClosed(job: Job) {
    const { name, id, stacktrace, failedReason } = job;
    const message = `[b]Закрытие задачи [${name}][${id}]: ${failedReason}[/b][br]>>${stacktrace.join('>>[br]')}`;

    this.bitrixImBotService.sendTestMessage(message);
    this.logger.info(
      `Закрытие задачи [${name}][${id}]: ${failedReason} => ${stacktrace.join('||')}`,
    );
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error) {
    const { name, id, stacktrace, failedReason } = job;
    const message =
      `[b]Ошибка выполнения задачи [${name}][${id}]: ${failedReason}[/b][br]>>${stacktrace.join('>>[br]')}[br][br]` +
      error.message;

    this.bitrixImBotService.sendTestMessage(message);
    this.logger.error(
      `Ошибка выполнения задачи [${name}][${id}]: ${failedReason} => ${stacktrace.join('||')} => ${error.message}`,
      '',
      true,
    );
  }

  @OnWorkerEvent('error')
  onError(error: Error) {
    const message = `[b]Ошибка выполнения задачи:[/b][br]${error.toString()}`;

    this.bitrixImBotService.sendTestMessage(message);
    this.logger.error(`Ошибка выполнения задачи: => ${error.toString()}`, '', true);
  }
}
