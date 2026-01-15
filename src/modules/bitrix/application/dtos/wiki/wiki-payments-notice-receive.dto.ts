import { B24WikiPaymentsNoticeReceiveOptions } from '@/modules/bitrix/application/interfaces/wiki/wiki-payments-notice-receive.inteface';
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

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
    description: '',
    required: false,
    example: '',
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
}
