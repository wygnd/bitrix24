import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import type { B24ImKeyboardOptions, B24ImSendMessage } from '../im.interface';

class B24KeyboardOptions {}

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
  @IsBoolean()
  SYSTEM: boolean = false;

  @ApiProperty({
    type: B24KeyboardOptions,
    description: 'Inline Buttons',
    required: false,
  })
  @IsOptional()
  @IsArray()
  KEYBOARD: B24ImKeyboardOptions;
}
