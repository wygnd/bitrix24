import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import type {
  B24ImKeyboardOptions,
  B24ImSendMessage,
} from '../interfaces/im.interface';
import { BoolString } from '@bitrix24/b24jssdk';
import { Type } from 'class-transformer';
import { ImbotMessageKeyboardOptionsDto } from '@/modules/bitirx/modules/imbot/dtos/imbot-message.dto';

export class SendMessageDto implements B24ImSendMessage {
  @ApiProperty({
    type: String,
    description: 'Chat id or user id',
    required: true,
    example: 'chat72187',
  })
  @IsNotEmpty()
  @IsString()
  DIALOG_ID: string;

  @ApiProperty({
    type: String,
    description: 'Message text',
    required: true,
    example: 'Hello, world',
  })
  @IsNotEmpty()
  @IsString()
  MESSAGE: string;

  @ApiProperty({
    type: Boolean,
    description: 'Is system message',
    example: false,
    required: false,
  })
  @IsOptional()
  @IsString()
  SYSTEM: string = 'N';

  @ApiProperty({
    type: ImbotMessageKeyboardOptionsDto,
    description: 'Inline Buttons',
    required: false,
  })
  @IsOptional()
  @IsArray()
  @Type(() => ImbotMessageKeyboardOptionsDto)
  KEYBOARD: ImbotMessageKeyboardOptionsDto[] = [];
}
