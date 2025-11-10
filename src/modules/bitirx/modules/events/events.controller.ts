import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { BitrixEventService } from '@/modules/bitirx/modules/events/event.service';
import { ApiTags } from '@nestjs/swagger';
import { B24ApiTags } from '@/modules/bitirx/interfaces/bitrix-api.interface';
import { AuthGuard } from '@/common/guards/auth.guard';
import { EventAddDto } from '@/modules/bitirx/modules/events/dtos/event-add.dto';

@ApiTags(B24ApiTags.EVENTS)
@UseGuards(AuthGuard)
@Controller('events')
export class BitrixEventsController {
  constructor(private readonly eventsService: BitrixEventService) {}

  @Post('/add')
  async addEvent(@Body() fields: EventAddDto) {
    return this.eventsService.addEvent(fields);
  }

  @Post('/handle/task/update')
  async handleTaskUpdate(@Body() fields: any) {
    console.log('check event task: ', fields);
  }
}
