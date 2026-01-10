import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';
import type { B24AuthOptions } from '../../../interfaces/bitrix.interface';
import type {
  B24EventCommand,
  B24EventData,
  B24EventParams,
  B24EventUser,
} from '@/modules/bitrix/modules/imbot/interfaces/imbot-events.interface';
import type { B24EventList } from '@/modules/bitrix/application/interfaces/events/events.interface';

class OnImCommandAddEventDataDto implements B24EventData {
  COMMAND: B24EventCommand;
  PARAMS: B24EventParams;
  USER: B24EventUser;
}

export class OnImCommandAddEventAuthOptionsDto implements B24AuthOptions {
  @ApiProperty({
    type: String,
    required: true,
  })
  access_token: string;

  @ApiProperty({
    type: Number,
    required: true,
  })
  expires: number;

  @ApiProperty({
    type: Number,
    required: true,
  })
  expires_in: number;

  @ApiProperty({
    type: String,
    required: true,
  })
  scope: string;

  @ApiProperty({
    type: String,
    required: true,
  })
  domain: string;

  @ApiProperty({
    type: String,
    required: true,
  })
  server_endpoint: string;

  @ApiProperty({
    type: String,
    required: true,
  })
  status: string;

  @ApiProperty({
    type: String,
    required: true,
  })
  client_endpoint: string;

  @ApiProperty({
    type: String,
    required: true,
  })
  member_id: string;

  @ApiProperty({
    type: Number,
    required: true,
  })
  user_id: number;

  @ApiProperty({
    type: String,
    required: true,
  })
  refresh_token: string;

  @ApiProperty({
    type: String,
    required: true,
  })
  application_token: string;
}

export class OnImCommandAddDto<T> {
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

export class OnImCommandKeyboardDto extends OnImCommandAddDto<B24EventData> {}
