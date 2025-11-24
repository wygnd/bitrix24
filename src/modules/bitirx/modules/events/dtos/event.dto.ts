import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty } from 'class-validator';
import type { B24EventList } from '@/modules/bitirx/modules/events/interfaces/events.interface';
import { Type } from 'class-transformer';
import type { B24AuthOptions } from '@/modules/bitirx/interfaces/bitrix.interface';
import { OnImCommandAddEventAuthOptionsDto } from '@/modules/bitirx/modules/imbot/dtos/imbot-events.dto';

export class EventOnDto<T> {
  @ApiProperty({
    type: String,
    description: 'Event type',
    required: true,
  })
  @IsNotEmpty()
  event: B24EventList;

  @ApiProperty({
    type: Number,
    required: true,
    description: 'Event handler id',
  })
  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  event_handler_id: number;

  @ApiProperty({
    required: true,
    description: 'Event data',
  })
  @IsNotEmpty()
  data: T;

  @ApiProperty({
    type: Number,
    required: true,
    description: 'time',
  })
  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  ts: number;

  @ApiProperty({
    type: OnImCommandAddEventAuthOptionsDto,
    required: true,
    description: 'Auth options',
  })
  @IsNotEmpty()
  auth: B24AuthOptions;
}
