import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { B24ImSendMessageResponseOptions } from '../interfaces/im.interface';

export class B24SendMessageDto {
  @ApiProperty({
    type: String,
    description: 'Chat id or user id',
    required: true,
    example: 'chat72187',
  })
  @IsNotEmpty()
  @IsString()
  userId: string;

  @ApiProperty({
    type: String,
    description: 'Message text',
    required: true,
    example: 'Hello, world',
  })
  @IsNotEmpty()
  @IsString()
  message: string;

  @ApiProperty({
    type: Boolean,
    description: 'Is system message',
    example: false,
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsIn(['N', 'Y'])
  system: string = 'N';
}

export class B24SendMessageResponse implements B24ImSendMessageResponseOptions {
  @ApiProperty({
    type: Boolean,
    description: 'Статус отправки сообщения',
    example: true,
  })
  status: boolean;

  @ApiProperty({
    type: Number,
    description: 'ID отправленного сообщения',
    example: 1234587676,
  })
  messageId: number;
}
