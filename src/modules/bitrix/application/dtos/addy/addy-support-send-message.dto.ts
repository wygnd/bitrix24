import {
  BitrixAddySupportSendMessageOptions,
  BitrixAddySupportSendMessageResponse,
} from '@/modules/bitrix/application/interfaces/addy/addy-support-send-message.interface';
import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class BitrixAddySupportSendMessageDto implements BitrixAddySupportSendMessageOptions {
  @ApiProperty({
    type: String,
    description: 'Сообщение',
    required: true,
    example: 'Какое-то сообщение',
  })
  @IsNotEmpty()
  @IsString()
  message: string;

  @ApiProperty({
    type: String,
    description: 'ID пользователя addy',
    required: true,
    example: '123',
  })
  @IsNotEmpty()
  @IsString()
  user_id: string;
}

export class BitrixAddySupportSendMessageResponseDto implements BitrixAddySupportSendMessageResponse {
  @ApiProperty({
    type: Boolean,
    description: 'Статус отправки сообщения',
    example: true,
  })
  status: boolean;

  @ApiProperty({
    type: String,
    description: 'Результат отправки сообщения',
    example: '12376784',
  })
  message: string;
}
