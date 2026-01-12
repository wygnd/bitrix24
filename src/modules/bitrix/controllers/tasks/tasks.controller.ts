import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@/common/guards/auth.guard';
import { ApiTags } from '@nestjs/swagger';
import { B24ApiTags } from '@/modules/bitrix/interfaces/bitrix-api.interface';
import { ApiExceptions } from '@/common/decorators/api-exceptions.decorator';
import { BitrixTasksUseCase } from '@/modules/bitrix/application/use-cases/tasks/tasks.use-case';

@ApiTags(B24ApiTags.TASKS)
@ApiExceptions()
@UseGuards(AuthGuard)
@Controller('/tasks')
export class BitrixTaskController {
  constructor(private readonly taskService: BitrixTasksUseCase) {}

  @Get('/task/:taskId')
  async getTaskById(@Param('taskId') taskId: string) {
    return this.taskService.getTaskById(taskId, undefined, 'cache');
  }
}
