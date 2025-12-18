import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import type { B24ImSendMessage } from '../interfaces/im.interface';
import { ImbotMessageKeyboardOptionsDto } from '@/modules/bitrix/modules/imbot/dtos/imbot-message.dto';

export class B24SendMessageDto implements B24ImSendMessage {
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
    isArray: true,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested()
  KEYBOARD: ImbotMessageKeyboardOptionsDto[] = [];
}
