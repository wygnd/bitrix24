import {
  B24ImbotCommandLanguageOptions,
  B24ImbotRegisterCommand,
} from '../imbot.interface';
import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class ImbotRegisterCommandDto implements B24ImbotRegisterCommand {
  @ApiProperty({
    type: Number,
    description: 'Bot id',
    example: 1234,
    required: true,
  })
  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  BOT_ID: number;

  @ApiProperty({
    type: String,
    description: 'Bot command',
    required: true,
    example: 'echo',
  })
  @IsNotEmpty()
  @IsString()
  COMMAND: string;

  @ApiProperty({
    type: Array<B24ImbotCommandLanguageOptions>,
    description: 'Languages',
    required: true,
  })
  @IsNotEmpty()
  LANG: B24ImbotCommandLanguageOptions[];

  @ApiProperty({
    type: String,
    description: 'Handler command url',
    required: true,
    example: 'https://example.com/handler',
  })
  @IsNotEmpty()
  @IsString()
  EVENT_COMMAND_ADD: string;
}
