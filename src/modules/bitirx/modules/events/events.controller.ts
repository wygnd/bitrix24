import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import { BitrixEventService } from '@/modules/bitirx/modules/events/event.service';
import { ApiTags } from '@nestjs/swagger';
import { B24ApiTags } from '@/modules/bitirx/interfaces/bitrix-api.interface';
import { AuthGuard } from '@/common/guards/auth.guard';
import { EventAddDto } from '@/modules/bitirx/modules/events/dtos/event-add.dto';
import { BitrixEventGuard } from '@/modules/bitirx/guards/bitrix-event.guard';
import { EventHandleUpdateTaskDto } from '@/modules/bitirx/modules/events/dtos/event-task-update.dto';
import express from 'express';

@ApiTags(B24ApiTags.EVENTS)
@Controller('events')
export class BitrixEventsController {
  constructor(private readonly eventsService: BitrixEventService) {}

  @UseGuards(AuthGuard)
  @Post('/add')
  async addEvent(@Body() fields: EventAddDto) {
    return this.eventsService.addEvent(fields);
  }

  @HttpCode(HttpStatus.OK)
  @UseGuards(BitrixEventGuard)
  @Post('/handle/task/update')
  async handleTaskUpdate(
    @Body() fields: EventHandleUpdateTaskDto,
    @Res() res: express.Response,
  ) {
    let status: HttpStatus = HttpStatus.OK;
    const resultHandlingTask =
      await this.eventsService.handleTaskUpdate(fields);

    if (!resultHandlingTask) status = HttpStatus.ACCEPTED;

    res.status(status).json(resultHandlingTask);
  }
}
