import {
  BitrixWikiMessage,
  BitrixWikiMessageResponse,
} from '@/modules/bitrix/application/interfaces/wiki/wiki-message.inferface';
import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class BitrixWikiMessageDTO implements BitrixWikiMessage {
  @ApiProperty({
    type: String,
    description: 'ID чата или группы',
    required: true,
    example: '123'
  })
  @IsNotEmpty()
  @IsString()
  chat_id: string;

  @ApiProperty({
    type: String,
    description: 'Сообщение',
    required: true,
    example: 'Привет мир!'
  })
  @IsNotEmpty()
  @IsString()
  message: string;
}

export class BitrixWikiMessageResponseDTO implements BitrixWikiMessageResponse {
  @ApiProperty({
    type: Boolean,
    required: true,
    description: 'Статус отправки сообщения',
    example: true
  })
  status: boolean;

  @ApiProperty({
    type: Number,
    required: false,
    description: 'ID отправленного сообщения. Передается, если сообщение было успешно отправлено',
    example: 1237643578
  })
  message_id: number | null;

  @ApiProperty({
    type: String,
    required: true,
    description: 'Статус отправки сообщения',
    example: true
  })
  message: string;
}