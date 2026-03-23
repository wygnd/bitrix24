import { B24WikiPaymentsNoticeReceiveOptions } from '@/modules/bitrix/application/interfaces/wiki/wiki-payments-notice-receive.inteface';
import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class B24WikiPaymentsNoticeReceiveDto implements B24WikiPaymentsNoticeReceiveOptions {
  @ApiProperty({
    type: String,
    description: 'Сообщение о поступлении платежа',
    required: true,
    example: 'Поступил платеж',
  })
  @IsNotEmpty()
  @IsString()
  message: string;

  @ApiProperty({
    type: String,
    description: 'Группа платежа',
    required: false,
    example: '0',
    default: '0',
  })
  @IsOptional()
  @IsString()
  group: string = '0';

  @ApiProperty({
    type: String,
    description: 'ID платежа',
    required: true,
    example: '1232363',
  })
  @IsNotEmpty()
  @IsString()
  payment_id: string;

  @ApiProperty({
    type: String,
    description: 'Флаг о возможной ошибке при определении платежа',
    required: false,
    example: '1',
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  maybe_mismatch: boolean = false;

  @ApiProperty({
    type: String,
    description: 'Совершен ли платеж через СБП',
    required: false,
    example: '1',
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value !== 'string') return false;

    return value == '1';
  })
  is_sbp: boolean = false;

  @ApiProperty({
    type: String,
    description: 'ID пользователя Битрикс24',
    required: false,
    example: '12',
  })
  @IsOptional()
  @IsString()
  bitrix_user_id?: string;

  @ApiProperty({
    type: String,
    description: 'Роль менеджера',
    required: false,
    example: 'ad_specialist',
  })
  @IsNotEmpty()
  @IsString()
  user_role?: string;

  @ApiProperty({
    type: String,
    description: 'Сделка',
    required: false,
    example: '123456',
  })
  @IsOptional()
  @IsString()
  deal_number?: string;

  @ApiProperty({
    type: String,
    description: 'Логин компании Яндекс Директ',
    required: false,
    example: 'login-example',
  })
  @IsOptional()
  @IsString()
  yandex_direct_login?: string;

  @ApiProperty({
    type: String,
    description: 'ФИО клиента',
    required: false,
    example: 'Иванов Иван Иванович',
  })
  @IsOptional()
  @IsString()
  client_full_name?: string;
}
