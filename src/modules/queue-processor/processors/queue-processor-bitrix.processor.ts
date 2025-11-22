import {  Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import {
  QUEUE_NAMES,
  QUEUE_TASK_NAMES,
} from '@/modules/queue-processor/queue-processor.constants';
import { BitrixMessageService } from '@/modules/bitirx/modules/im/im.service';
import { BitrixService } from '@/modules/bitirx/bitrix.service';
import { B24TaskExtended } from '@/modules/bitirx/modules/task/interfaces/task.interface';
import { BitrixTaskService } from '@/modules/bitirx/modules/task/task.service';

@Processor(QUEUE_NAMES.QUEUE_BITRIX_EVENTS)
export class QueueProcessorBitrixProcessor extends WorkerHost {
  constructor(
    private readonly taskService: BitrixTaskService,
    private readonly bitrixService: BitrixService,
    private readonly messageService: BitrixMessageService,
  ) {
    super();
  }

  async process(job: Job) {
    const { name, data } = job;

    console.log(data);

    switch (name) {
      case QUEUE_TASK_NAMES.QUEUE_BX_TASK_UPDATE:
        return this.handleTaskUpdateBxTask(data as B24TaskExtended);

      case QUEUE_TASK_NAMES.QUEUE_BX_INTEGRATION_AVITO_HANDLE_REQUEST:
        return {
          message: 'lead created',
          leadId: 123,
        };

      case QUEUE_TASK_NAMES.QUEUE_BX_TEST:
        // const { result: messageId } =
        //   await this.messageService.sendPrivateMessage({
        //     DIALOG_ID: this.bitrixService.TEST_CHAT_ID,
        //     MESSAGE: `Тест очереди: ${data}`,
        //   });

        return data;
    }

    return false;
  }

  private async handleTaskUpdateBxTask(data: B24TaskExtended) {
    this.taskService.handleObserveEdnSmmAdvertLayoutsTaskUpdate(data);

    return true;
  }

  // @OnWorkerEvent('failed')
  // onFailed(job: Job) {
  //   console.log(`job failed ${job}`);
  // }

  // @OnWorkerEvent('active')
  // onActive(job: Job) {
  //   console.log(`job active ${job}`);
  // }

  // @OnWorkerEvent('completed')
  // onCompleted(job: Job) {
  //   console.log('job completed', job);
  // }
}
