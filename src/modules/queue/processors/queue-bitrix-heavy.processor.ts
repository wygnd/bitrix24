import { QUEUE_NAMES, QUEUE_TASKS } from '@/modules/queue/queue.constants';
import { Job } from 'bullmq';
import {
  QueueProcessorResponse,
  QueueProcessorStatus,
} from '@/modules/queue/interfaces/queue-consumer.interface';
import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { HeadhunterWebhookCallDto } from '@/modules/bitrix/application/dtos/headhunter/headhunter-webhook-call.dto';
import { WinstonLogger } from '@/config/winston.logger';
import { BitrixHeadhunterUseCase } from '@/modules/bitrix/application/use-cases/headhunter/headhunter.use-case';

@Processor(QUEUE_NAMES.QUEUE_BITRIX_HEAVY, { concurrency: 1 })
export class QueueBitrixHeavyProcessor extends WorkerHost {
  private readonly logger = new WinstonLogger(QueueBitrixHeavyProcessor.name, [
    'queue',
    'handle',
  ]);

  constructor(private readonly bitrixHeadhunter: BitrixHeadhunterUseCase) {
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
    this.logger.debug(`Добавлена задача [${name}][${id}] в очередь`);

    switch (name) {
      case QUEUE_TASKS.HEAVY.QUEUE_BX_HANDLE_WEBHOOK_FROM_HH:
        response.message = 'handle new webhook from hh.ru';
        response.data =
          await this.bitrixHeadhunter.handleNewResponseVacancyWebhook(
            data as HeadhunterWebhookCallDto,
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
    this.logger.debug({
      message: `Задача [${name}][${id}] выполнена`,
      response,
    });
  }

  @OnWorkerEvent('closed')
  onClosed(job: Job) {
    const { name, id, failedReason } = job;

    this.logger.debug({
      message: `Закрытие задачи [${name}][${id}]: ${failedReason}`,
      job,
    });
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error) {
    this.logger.error({
      job,
      error,
    });
  }

  @OnWorkerEvent('error')
  onError(error: Error) {
    this.logger.error({ error });
  }
}
