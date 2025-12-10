import {
  B24OnCRMDealUpdateEvent,
  B24OnCRMDealUpdateEventData,
} from '@/modules/bitrix/modules/deal/interfaces/deal-event.interace';
import type { B24AuthOptions } from '@/modules/bitrix/interfaces/bitrix.interface';
import { ApiProperty } from '@nestjs/swagger';
import { Equals, IsInt, IsNotEmpty, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { OnImCommandAddEventAuthOptionsDto } from '@/modules/bitrix/modules/imbot/dtos/imbot-events.dto';

export class OnCRMDealUpdateEventBodyDataDto implements B24OnCRMDealUpdateEventData {
  @IsNotEmpty()
  FIELDS: {
    ID: string;
  };
}

export class OnCRMDealUpdateEventBodyDto implements B24OnCRMDealUpdateEvent {
  @ApiProperty({
    type: String,
    description: 'event name',
    required: true,
    example: 'ONCRMDEALUPDATE',
  })
  @IsNotEmpty()
  @IsString()
  @Equals('ONCRMDEALUPDATE')
  event: 'ONCRMDEALUPDATE';

  @ApiProperty({
    type: String,
    description: 'event handler id',
    required: true,
    example: 216,
  })
  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  event_handler_id: number;

  @ApiProperty({
    type: OnCRMDealUpdateEventBodyDataDto,
    description: 'event data',
    required: true,
    example: OnCRMDealUpdateEventBodyDataDto,
  })
  @IsNotEmpty()
  data: OnCRMDealUpdateEventBodyDataDto;

  @ApiProperty({
    type: Number,
  })
  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  ts: number;

  @ApiProperty({
    type: OnImCommandAddEventAuthOptionsDto,
    description: 'auth options',
    required: true,
    example: OnImCommandAddEventAuthOptionsDto,
  })
  auth: B24AuthOptions;
}
