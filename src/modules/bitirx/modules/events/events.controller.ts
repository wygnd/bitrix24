import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { BitrixEventService } from '@/modules/bitirx/modules/events/event.service';
import { ApiTags } from '@nestjs/swagger';
import { B24ApiTags } from '@/modules/bitirx/interfaces/bitrix-api.interface';
import { AuthGuard } from '@/common/guards/auth.guard';
import { EventAddDto } from '@/modules/bitirx/modules/events/dtos/event-add.dto';
import { BitrixEventGuard } from '@/modules/bitirx/guards/bitrix-event.guard';
import { EventHandleUpdateTaskDto } from '@/modules/bitirx/modules/events/dtos/event-task-update.dto';
import { EventLeadDeleteDto } from '@/modules/bitirx/modules/events/dtos/event-lead-delete.dto';

@ApiTags(B24ApiTags.EVENTS)
@Controller('events')
export class BitrixEventsController {
  constructor(private readonly eventsService: BitrixEventService) {}

  @UseGuards(AuthGuard)
  @Post('/add')
  async addEvent(@Body() fields: EventAddDto) {
    return this.eventsService.addEvent(fields);
  }

  @UseGuards(BitrixEventGuard)
  @HttpCode(HttpStatus.ACCEPTED)
  @Post('/handle/task/update')
  async handleTaskUpdate(@Body() fields: EventHandleUpdateTaskDto) {
    await this.eventsService.handleTaskUpdate(fields);
    return true;
  }

  @UseGuards(BitrixEventGuard)
  @HttpCode(HttpStatus.ACCEPTED)
  @Post('/handle/lead/delete')
  async handleLeadDelete(@Body() fields: EventLeadDeleteDto) {
    return this.eventsService.handleLeadDelete(fields);
  }
}
