import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { QUEUE_NAMES, QUEUE_TASK_NAMES } from '@/modules/queue/queue.constants';
import { B24TaskExtended } from '@/modules/bitirx/modules/task/interfaces/task.interface';
import { BitrixTaskService } from '@/modules/bitirx/modules/task/task.service';

@Processor(QUEUE_NAMES.QUEUE_BITRIX_EVENTS)
export class QueueBitrixProcessor extends WorkerHost {
  constructor(private readonly taskService: BitrixTaskService) {
    super();
  }

  async process(job: Job) {
    const { name, data } = job;

    console.log(name);

    switch (name) {
      case QUEUE_TASK_NAMES.QUEUE_BX_TASK_UPDATE:
        return this.handleTaskUpdateBxTask(data as B24TaskExtended);

      case QUEUE_TASK_NAMES.QUEUE_BX_INTEGRATION_AVITO_HANDLE_REQUEST:
        console.log('madd');
        return {
          message: 'lead created',
          leadId: 123,
        };
    }

    return false;
  }

  private async handleTaskUpdateBxTask(data: B24TaskExtended) {
    this.taskService.handleObserveEdnSmmAdvertLayoutsTaskUpdate(data);

    return true;
  }
}
