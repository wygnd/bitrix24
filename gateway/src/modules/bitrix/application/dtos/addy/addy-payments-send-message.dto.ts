import {
  BitrixAddyPaymentsSendMessageNoticeOptions,
  BitrixAddyPaymentsSendMessagePaymentOptions,
  BitrixAddyPaymentsSendMessageQuery,
  BitrixAddyPaymentsSendMessageResponse,
} from '@/modules/bitrix/application/interfaces/addy/addy-payments-send-message.interface';
import type { BitrixAddyPaymentsSendMessageType } from '@/modules/bitrix/application/interfaces/addy/addy-payments-send-message.interface';
import { IsIn, IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { BITRIX_ADDY_PAYMENT_MESSAGE_TYPE } from '@/modules/bitrix/application/constants/addy/addy-payments.dto';

export class BitrixAddyPaymentsSendMessagePaymentDto implements BitrixAddyPaymentsSendMessagePaymentOptions {
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

export class BitrixAddyPaymentsSendMessageQueryDTO implements BitrixAddyPaymentsSendMessageQuery {
  @ApiProperty({
    type: String,
    description: 'Тип сообщения',
    required: true,
    enum: BITRIX_ADDY_PAYMENT_MESSAGE_TYPE,
    example: 'payment',
  })
  @IsOptional()
  @IsString()
  @IsIn(BITRIX_ADDY_PAYMENT_MESSAGE_TYPE, {
    message: 'type is not valid property',
  })
  type: BitrixAddyPaymentsSendMessageType = 'payment';
}

export class BitrixAddyPaymentsSendMessageNoticeDTO implements BitrixAddyPaymentsSendMessageNoticeOptions {
  @IsNotEmpty()
  @IsString()
  message: string;
}
