import { B24ImbotSendMessageOptions } from '@/modules/bitirx/modules/imbot/imbot.interface';
import {
  IsArray,
  IsIn,
  IsNotEmpty,
  IsNotEmptyObject,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { ImbotMessageKeyboardOptionsDto } from '@/modules/bitirx/modules/imbot/dtos/imbot-message.dto';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class ImbotMessageAddDto
  implements Omit<B24ImbotSendMessageOptions, 'BOT_ID'>
{
  @ApiProperty({
    type: String,
    description: 'message',
    required: true,
    example: 'my message',
  })
  @IsNotEmpty()
  @IsString()
  MESSAGE: string;

  @ApiProperty({
    type: String,
    description: 'dialog id or user id',
    required: true,
    example: 'chat1234',
  })
  @IsNotEmpty()
  @IsString()
  DIALOG_ID: string;

  @ApiProperty({
    type: [ImbotMessageKeyboardOptionsDto],
    description: 'message buttons',
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested()
  @Type(() => ImbotMessageKeyboardOptionsDto)
  KEYBOARD: ImbotMessageKeyboardOptionsDto[] = [];

  @ApiProperty({
    type: String,
    description: 'send as system message or not',
    required: false,
    example: 'Y',
    default: 'N',
  })
  @IsOptional()
  @IsString()
  @IsIn(['Y', 'N'])
  SYSTEM: 'Y' | 'N' = 'N';
}
