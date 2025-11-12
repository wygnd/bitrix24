import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { QUEUE_NAMES, QUEUE_TASK_NAMES } from '@/modules/queue/queue.constants';
import { B24TaskExtended } from '@/modules/bitirx/modules/task/interfaces/task.interface';
import { BitrixTaskService } from '@/modules/bitirx/modules/task/task.service';
import { BitrixDealService } from '@/modules/bitirx/modules/deal/deal.service';
import { QueueDistributeDeal } from '@/modules/queue/interfaces/queue-distribute-deal.interface';
import { BitrixWebhookService } from '@/modules/bitirx/modules/webhook/webhook.service';

@Processor(QUEUE_NAMES.QUEUE_BITRIX_EVENTS)
export class QueueBitrixProcessor extends WorkerHost {
  constructor(
    private readonly taskService: BitrixTaskService,
    private readonly dealService: BitrixDealService,
    private readonly webhookService: BitrixWebhookService,
  ) {
    super();
  }

  async process(job: Job) {
    const { name, data } = job;

    switch (name) {
      case QUEUE_TASK_NAMES.QUEUE_BX_TASK_UPDATE:
        this.handleTaskUpdateBxTask(data as B24TaskExtended);
        break;

      case QUEUE_TASK_NAMES.QUEUE_BX_IS_DISTRIBUTED_DEAL:
        this.handleTaskIsDistributedDeal(data as QueueDistributeDeal);
        break;

      default:
        return false;
    }

    return true;
  }

  private async handleTaskUpdateBxTask(data: B24TaskExtended) {
    this.taskService.handleObserveEdnSmmAdvertLayoutsTaskUpdate(data);
  }

  private async handleTaskIsDistributedDeal({
    distributedStage,
    ...data
  }: QueueDistributeDeal) {
    const deal = await this.dealService.getDealById(data.deal_id, 'force');

    if (!distributedStage || deal.STAGE_ID !== distributedStage) return;

    this.webhookService.handleIncomingWebhookToDistributeNewDeal(data);
  }
}
