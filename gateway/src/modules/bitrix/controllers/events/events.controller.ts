import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { B24ApiTags } from '@/modules/bitrix/interfaces/bitrix-api.interface';
import { AuthGuard } from '@/common/guards/auth.guard';
import { EventAddDto } from '@/modules/bitrix/application/dtos/events/event-add.dto';
import { BitrixEventGuard } from '@/modules/bitrix/guards/bitrix-event.guard';
import { EventHandleUpdateTaskDto } from '@/modules/bitrix/application/dtos/events/event-task-update.dto';
import { EventLeadDeleteDto } from '@/modules/bitrix/application/dtos/events/event-lead-delete.dto';
import { B24EventRemoveDto } from '@/modules/bitrix/application/dtos/events/event-remove.dto';
import { ApiExceptions } from '@/common/decorators/api-exceptions.decorator';
import { BitrixEventsUseCase } from '@/modules/bitrix/application/use-cases/events/events.use-case';

@ApiTags(B24ApiTags.EVENTS)
@ApiExceptions()
@Controller('events')
export class BitrixEventsController {
  constructor(private readonly bitrixEvents: BitrixEventsUseCase) {}

  @ApiOperation({ summary: 'Register new events' })
  @UseGuards(AuthGuard)
  @Post('event/add')
  async addEvent(@Body() fields: EventAddDto) {
    return this.bitrixEvents.addEvent(fields);
  }

  @ApiOperation({ summary: 'Get Event List' })
  @UseGuards(AuthGuard)
  @Get('/list')
  async getEventList() {
    return this.bitrixEvents.getEventList();
  }

  @ApiOperation({ summary: 'Remove event listener' })
  @UseGuards(AuthGuard)
  @Delete('event/remove')
  async removeEvent(@Body() fields: B24EventRemoveDto) {
    return this.bitrixEvents.removeEvent(fields);
  }

  @UseGuards(BitrixEventGuard)
  @HttpCode(HttpStatus.ACCEPTED)
  @Post('/handle/task/update')
  async handleTaskUpdate(@Body() fields: EventHandleUpdateTaskDto) {
    await this.bitrixEvents.handleTaskUpdate(fields);
    return true;
  }

  @UseGuards(BitrixEventGuard)
  @HttpCode(HttpStatus.ACCEPTED)
  @Post('/handle/lead/delete')
  async handleLeadDelete(@Body() fields: EventLeadDeleteDto) {
    return this.bitrixEvents.handleLeadDelete(fields);
  }
}
