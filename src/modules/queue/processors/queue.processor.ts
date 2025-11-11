import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { QUEUE_NAMES, QUEUE_TASK_NAMES } from '@/modules/queue/queue.constants';
import { B24TaskExtended } from '@/modules/bitirx/modules/task/interfaces/task.interface';
import { BitrixTaskService } from '@/modules/bitirx/modules/task/task.service';

@Processor(QUEUE_NAMES.QUEUE_BITRIX_EVENTS)
export class QueueProcessor extends WorkerHost {
  constructor(private readonly taskService: BitrixTaskService) {
    super();
  }

  async process(job: Job) {
    const { name, data } = job;

    switch (name) {
      case QUEUE_TASK_NAMES.QUEUE_BX_TASK_UPDATE:
        this.handleTaskUpdateBxTask(data as B24TaskExtended);
        break;

      default:
        return false;
    }

    return true;
  }

  private async handleTaskUpdateBxTask(data: B24TaskExtended) {
    this.taskService.handleObserveEdnSmmAdvertLayoutsTaskUpdate(data);
  }
}
