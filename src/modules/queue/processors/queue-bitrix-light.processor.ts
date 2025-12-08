import { QUEUE_NAMES, QUEUE_TASKS } from '@/modules/queue/queue.constants';
import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import {
  QueueProcessorResponse,
  QueueProcessorStatus,
} from '@/modules/queue/interfaces/queue-consumer.interface';
import { WikiService } from '@/modules/wiki/wiki.service';
import { BitrixImBotService } from '@/modules/bitirx/modules/imbot/imbot.service';
import { WinstonLogger } from '@/config/winston.logger';

@Processor(QUEUE_NAMES.QUEUE_BITRIX_LIGHT, { concurrency: 10 })
export class QueueBitrixLightProcessor extends WorkerHost {
  private readonly logger = new WinstonLogger(
    `queue:handle:${QueueBitrixLightProcessor.name}`,
  );

  constructor(
    private readonly wikiService: WikiService,
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
    this.logger.info(
      `Добавлена задача [${name}][${id}] в очередь => ${JSON.stringify(data)}`,
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
    this.logger.info(
      `Задача [${name}][${id}] выполнена => ${JSON.stringify(returnvalue)}`,
    );
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job) {
    this.bitrixImBotService.sendTestMessage(
      `Ошибка выполнения задачи: ` + JSON.stringify(job),
    );

    this.logger.error(`Ошибка выполнения задачи => ${JSON.stringify(job)}`);
  }
}
