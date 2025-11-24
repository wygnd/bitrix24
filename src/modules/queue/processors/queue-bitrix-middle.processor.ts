import { QUEUE_NAMES, QUEUE_TASKS } from '@/modules/queue/queue.constants';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import {
  QueueProcessorResponse,
  QueueProcessorStatus,
} from '@/modules/queue/interfaces/queue-consumer.interface';
import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { AvitoCreateLeadDto } from '@/modules/bitirx/modules/integration/avito/dtos/avito-create-lead.dto';
import { IntegrationAvitoDistributeLeadFromAvito } from '@/modules/bitirx/modules/integration/avito/interfaces/avito-distribute-lead-from-avito.interface';
import { BitrixIntegrationAvitoService } from '@/modules/bitirx/modules/integration/avito/avito.service';
import { BitrixImBotService } from '@/modules/bitirx/modules/imbot/imbot.service';
import { WikiService } from '@/modules/wiki/wiki.service';

@Processor(QUEUE_NAMES.QUEUE_BITRIX_MIDDLE, { concurrency: 3 })
export class QueueBitrixMiddleProcessor extends WorkerHost {
  private readonly logger = new Logger(QueueBitrixMiddleProcessor.name);

  constructor(
    private readonly bitrixIntegrationAvitoService: BitrixIntegrationAvitoService,
    private readonly bitrixImBotService: BitrixImBotService,
    private readonly wikiService: WikiService,
  ) {
    super();
  }

  /* ==================== CONSUMERS ==================== */
  async process(job: Job): Promise<QueueProcessorResponse> {
    const { name, data } = job;

    switch (name) {
      case QUEUE_TASKS.QUEUE_BX_INTEGRATION_AVITO_HANDLE_CLIENT_REQUEST_FROM_AVITO:
        this.bitrixImBotService.sendTestMessage(
          `[b]receive-client-request[/b][br]Добавлено в очередь: ${name}[br]` +
            JSON.stringify(data),
        );
        return this.handleTaskClientRequestFromAvito(
          data as AvitoCreateLeadDto,
        );
    }

    this.logger.warn(`not handled yet: ${name}`);
    return {
      message: 'Not handled',
      status: QueueProcessorStatus.OK,
      data: null,
    } as QueueProcessorResponse<null>;
  }

  private async handleTaskClientRequestFromAvito(
    fields: AvitoCreateLeadDto,
  ): Promise<QueueProcessorResponse<IntegrationAvitoDistributeLeadFromAvito>> {
    return {
      message: 'Success',
      status: QueueProcessorStatus.OK,
      data: await this.bitrixIntegrationAvitoService.distributeClientRequestFromAvito(
        fields,
      ),
    };
  }

  /* ==================== EVENTS LISTENERS ==================== */
  @OnWorkerEvent('completed')
  onCompleted({ name, returnvalue }: Job) {
    switch (name) {
      case QUEUE_TASKS.QUEUE_BX_INTEGRATION_AVITO_HANDLE_CLIENT_REQUEST_FROM_AVITO:
        const { data } =
          returnvalue as QueueProcessorResponse<IntegrationAvitoDistributeLeadFromAvito>;

        this.bitrixImBotService.sendTestMessage(
          `[b]receive-client-request[/b][br]Очередь завершена: ${name}[br]` +
            JSON.stringify(data),
        );
        this.wikiService.sendResultReceiveClientRequestFromAvitoToWiki({
          wiki_lead_id: data.wiki_lead_id,
          lead_id: data.lead_id,
          status: data.status,
        });
        break;
    }
  }
}
