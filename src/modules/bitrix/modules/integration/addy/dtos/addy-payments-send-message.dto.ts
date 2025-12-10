import {
  BitrixAddyPaymentsSendMessageOptions,
  BitrixAddyPaymentsSendMessageResponse,
} from '@/modules/bitrix/modules/integration/addy/interfaces/addy-payments-send-message.interface';
import { IsInt, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class BitrixAddyPaymentsSendMessageDto implements BitrixAddyPaymentsSendMessageOptions {
  @ApiProperty({
    type: String,
    description: 'ID пользователя addy',
    required: true,
    example: '1234',
  })
  @IsNotEmpty()
  @IsString()
  user_id: string;

  @ApiProperty({
    type: String,
    description: 'Ссылка на счет',
    required: true,
    example: 'https://link-example.ru',
  })
  @IsNotEmpty()
  @IsString()
  link: string;

  @ApiProperty({
    type: String,
    description: 'Сумма (в копейках)',
    required: true,
    example: '10000',
  })
  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  price: number;

  @ApiProperty({
    type: String,
    description: 'Номер договора',
    required: true,
    example: '89567',
  })
  @IsNotEmpty()
  @IsString()
  contract: string;

  @ApiProperty({
    type: String,
    description: 'Данные клиента',
    required: true,
    example: '72364 Имя клиента',
  })
  @IsNotEmpty()
  @IsString()
  client: string;
}

export class BitrixAddyPaymentsSendMessageResponseDto implements BitrixAddyPaymentsSendMessageResponse {
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
