import type {
  B24EventList,
  B24EventCommand,
  B24EventData,
  B24EventParams,
  B24EventUser,
} from '../interfaces/bitrix-events.interface';
import type { B24AuthOptions } from '../interfaces/bitrix.interface';
import { IsInt, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class OnImCommandAddEventDataDto implements B24EventData {
  COMMAND: B24EventCommand;
  PARAMS: B24EventParams;
  USER: B24EventUser;
}

class OnImCommandAddEventAuthOptionsDto implements B24AuthOptions {
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

export class OnImCommandAddDto {
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
    type: OnImCommandAddEventDataDto,
    required: true,
    description: 'Event data',
  })
  @IsNotEmpty()
  data: B24EventData;

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
