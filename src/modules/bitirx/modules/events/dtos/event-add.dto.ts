import { B24EventAdd } from '@/modules/bitirx/modules/events/interfaces/events.interface';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class EventAddDto implements B24EventAdd {
  @ApiProperty({
    type: String,
    description: 'event place',
    required: true,
    example: 'ONCRMLEADADD',
  })
  @IsNotEmpty()
  @IsString()
  event: string;
  @ApiProperty({
    type: String,
    description: 'event handler url',
    required: true,
    example: 'https://exmaple.com/handler',
  })
  @IsNotEmpty()
  @IsString()
  handler: string;

  @ApiProperty({
    type: String,
    description: 'bitrix user id',
    required: false,
    default: '',
  })
  @IsOptional()
  @IsString()
  auth_type?: number;

  @ApiProperty({
    type: String,
    description: 'event type',
    required: false,
    default: '',
  })
  @IsOptional()
  @IsString()
  event_type?: string;

  @ApiProperty({
    type: String,
    description: 'auth connector',
    required: false,
    default: '',
  })
  @IsOptional()
  @IsString()
  auth_connector?: string;

  @ApiProperty({
    type: String,
    description: 'some options',
    required: false,
    default: '',
  })
  @IsOptional()
  @IsString()
  options?: string;
}
