import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { BitrixTaskService } from '@/modules/bitrix/modules/task/task.service';
import { AuthGuard } from '@/common/guards/auth.guard';
import { ApiTags } from '@nestjs/swagger';
import { B24ApiTags } from '@/modules/bitrix/interfaces/bitrix-api.interface';

@UseGuards(AuthGuard)
@ApiTags(B24ApiTags.TASKS)
@Controller('/tasks')
export class BitrixTaskController {
  constructor(private readonly taskService: BitrixTaskService) {}

  @Get('/task/:taskId')
  async getTaskById(@Param('taskId') taskId: string) {
    return this.taskService.getTaskById(taskId, undefined, true);
  }
}
