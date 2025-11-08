import {
  B24ImbotCommandLanguageOptions,
  B24ImbotRegisterCommand,
} from '../imbot.interface';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { IsNotEmptyString } from '@/modules/bitirx/decorators/is-not-empty-string.decorator';

export class ImboRegisterCommandLangDto
  implements B24ImbotCommandLanguageOptions
{
  @ApiProperty({
    type: String,
    description: 'Language ID',
    required: true,
    example: 'ru',
  })
  @IsNotEmpty()
  @IsString()
  LANGUAGE_ID: string;

  @ApiProperty({
    type: String,
    description: 'Command title',
    required: true,
    example: 'Сообщение',
  })
  @IsNotEmpty()
  @IsString()
  TITLE: string;

  @ApiProperty({
    type: String,
    description: 'Params',
    required: false,
    example: 'message_test',
    default: '',
  })
  @IsOptional()
  @IsString()
  PARAMS: string = '';
}

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
    type: [ImboRegisterCommandLangDto],
    description: 'Languages',
    required: true,
  })
  @IsArray()
  @IsNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => ImboRegisterCommandLangDto)
  LANG: ImboRegisterCommandLangDto[];

  @ApiProperty({
    type: String,
    description: 'client id ',
    required: true,
    example: '1',
  })
  @IsOptional()
  @IsString()
  CLIENT_ID?: string;

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
