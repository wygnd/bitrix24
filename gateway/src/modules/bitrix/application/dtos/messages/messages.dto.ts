import {
  IsArray,
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { B24ImSendMessageResponseOptions } from '../../interfaces/messages/messages.interface';
import { Type } from 'class-transformer';

export class B24SendMessageAttachFileDto {
  @ApiProperty({
    type: String,
    description: 'file link',
    required: true,
    example: 'https://example.com/file.png',
  })
  @IsNotEmpty()
  @IsString()
  link: string;

  @ApiProperty({
    type: String,
    description: 'filename',
    required: true,
    example: 'file.png',
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    type: Number,
    description: 'File size in bytes',
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  size?: number;
}

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
  @IsBoolean()
  system: boolean = false;

  @ApiProperty({
    type: B24SendMessageAttachFileDto,
    isArray: true,
    description: 'Files',
    required: false,
  })
  @IsOptional()
  @IsArray()
  files: B24SendMessageAttachFileDto[] = [];
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
