import { QUEUE_NAMES, QUEUE_TASKS } from '@/modules/queue/queue.constants';
import { Job } from 'bullmq';
import {
  QueueProcessorResponse,
  QueueProcessorStatus,
} from '@/modules/queue/interfaces/queue-consumer.interface';
import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { HeadhunterWebhookCallDto } from '@/modules/bitrix/application/dtos/headhunter/headhunter-webhook-call.dto';
import { LeadManagerCallingDto } from '@/modules/bitrix/application/dtos/leads/lead-manager-calling.dto';
import { WinstonLogger } from '@/config/winston.logger';
import { BitrixBotUseCase } from '@/modules/bitrix/application/use-cases/bot/bot.use-case';
import { BitrixLeadsUseCase } from '@/modules/bitrix/application/use-cases/leads/leads.use-case';
import { BitrixHeadhunterUseCase } from '@/modules/bitrix/application/use-cases/headhunter/headhunter.use-case';

@Processor(QUEUE_NAMES.QUEUE_BITRIX_HEAVY, { concurrency: 1 })
export class QueueBitrixHeavyProcessor extends WorkerHost {
  private readonly logger = new WinstonLogger(QueueBitrixHeavyProcessor.name, [
    'queue',
    'handle',
  ]);

  constructor(
    private readonly bitrixHeadhunter: BitrixHeadhunterUseCase,
    private readonly bitrixBot: BitrixBotUseCase,
    private readonly bitrixLeadService: BitrixLeadsUseCase,
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

    const { name, data, id } = job;
    this.bitrixBot.sendTestMessage(
      `[b]Добавлена задача [${name}][${id}] в очередь[/b]`,
    );
    this.logger.debug(`Добавлена задача [${name}][${id}] в очередь`);

    switch (name) {
      case QUEUE_TASKS.HEAVY.QUEUE_BX_HANDLE_WEBHOOK_FROM_HH:
        response.message = 'handle new webhook from hh.ru';
        response.data =
          await this.bitrixHeadhunter.handleNewResponseVacancyWebhook(
            data as HeadhunterWebhookCallDto,
          );
        break;

      case QUEUE_TASKS.HEAVY.QUEUE_BX_HANDLE_OBSERVE_MANAGER_CALLING:
        response.message = 'handle observe manager calling task';
        response.data =
          await this.bitrixLeadService.handleObserveManagerCalling(
            data as LeadManagerCallingDto,
          );
        break;

      default:
        this.logger.warn(`not handled yet: ${name}`);
        response.message = 'Not handled';
        response.status = QueueProcessorStatus.NOT_HANDLED;
        break;
    }

    this.logger.debug({
      message: 'check result run task',
      response,
    });

    return response;
  }

  /* ==================== EVENTS LISTENERS ==================== */
  @OnWorkerEvent('completed')
  onCompleted({ name, returnvalue: response, id }: Job) {
    this.bitrixBot.sendTestMessage(
      `[b]Задача [${name}][${id}] выполнена:[/b][br]`,
    );
    this.logger.debug({
      message: `Задача [${name}][${id}] выполнена`,
      response,
    });
  }

  @OnWorkerEvent('closed')
  onClosed(job: Job) {
    const { name, id, stacktrace, failedReason } = job;
    const message = `[b]Закрытие задачи [${name}][${id}]: ${failedReason}[/b][br]>>${stacktrace.join('>>[br]')}`;

    this.bitrixBot.sendTestMessage(message);
    this.logger.debug({
      message: `Закрытие задачи [${name}][${id}]: ${failedReason}`,
      job,
    });
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error) {
    const logMessage = `Ошибка выполнения задачи:`;

    this.bitrixBot.sendTestMessage(
      `[b]${logMessage}: [${job.name}][${job.id}][/b] `,
    );

    this.logger.error({
      message: logMessage,
      error,
    });
  }

  @OnWorkerEvent('error')
  onError(error: Error) {
    const logMessage = 'Ошибка выполнения задачи';
    const message = `[b]${logMessage}:[/b][br]${error.toString()}`;

    this.bitrixBot.sendTestMessage(message);
    this.logger.error({ message: logMessage, error });
    this.logger.log(message, 'error');
  }
}
