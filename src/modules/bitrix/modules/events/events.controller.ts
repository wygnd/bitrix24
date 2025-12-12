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
import { BitrixEventService } from '@/modules/bitrix/modules/events/event.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { B24ApiTags } from '@/modules/bitrix/interfaces/bitrix-api.interface';
import { AuthGuard } from '@/common/guards/auth.guard';
import { EventAddDto } from '@/modules/bitrix/modules/events/dtos/event-add.dto';
import { BitrixEventGuard } from '@/modules/bitrix/guards/bitrix-event.guard';
import { EventHandleUpdateTaskDto } from '@/modules/bitrix/modules/events/dtos/event-task-update.dto';
import { EventLeadDeleteDto } from '@/modules/bitrix/modules/events/dtos/event-lead-delete.dto';
import { B24EventRemoveDto } from '@/modules/bitrix/modules/events/dtos/event-remove.dto';
import { B24EventVoxImplantCallEndDto } from '@/modules/bitrix/modules/events/dtos/event-voximplant-call-end.dto';
import { BitrixVoxImplantEventGuard } from '@/modules/bitrix/guards/bitrix-webhook-voximplant.guard';

@ApiTags(B24ApiTags.EVENTS)
@Controller('events')
export class BitrixEventsController {
  constructor(private readonly eventsService: BitrixEventService) {}

  @ApiOperation({ summary: 'Register new events' })
  @UseGuards(AuthGuard)
  @Post('event/add')
  async addEvent(@Body() fields: EventAddDto) {
    return this.eventsService.addEvent(fields);
  }

  @ApiOperation({ summary: 'Get Event List' })
  @UseGuards(AuthGuard)
  @Get('/list')
  async getEventList() {
    return this.eventsService.getEventList();
  }

  @ApiOperation({ summary: 'Remove event listener' })
  @UseGuards(AuthGuard)
  @Delete('event/remove')
  async removeEvent(@Body() fields: B24EventRemoveDto) {
    return this.eventsService.removeEvent(fields);
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

  @UseGuards(BitrixVoxImplantEventGuard)
  @Post('/handle/calling/end')
  async handleOnVoximplantCallEnd(
    @Body() fields: B24EventVoxImplantCallEndDto,
  ) {
    return this.eventsService.handleVoxImplantCallEnd(fields);
  }
}
