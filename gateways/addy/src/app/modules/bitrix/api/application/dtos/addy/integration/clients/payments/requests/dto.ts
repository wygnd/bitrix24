import { IB24AddyIntegrationAddClientPaymentRequest } from '../../../../../../interfaces/addy/integration/clients/payments/requests/interface';
import {
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class B24AddyIntegrationAddClientPaymentRequestDTO implements IB24AddyIntegrationAddClientPaymentRequest {
  @ApiProperty({
    type: Number,
    required: false,
    description: 'Сумма платежа',
    example: '1233245',
  })
  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  amount: number;

  @ApiProperty({
    type: Number,
    required: false,
    description: 'Сумма без комиссии',
    example: '12334',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  amount_without_commission: number;

  @ApiProperty({
    type: String,
    required: false,
    description: 'Тип платежа',
    example: '',
  })
  @IsOptional()
  @IsString()
  method_type: string;

  @ApiProperty({
    type: String,
    required: false,
    description: 'Время платежа',
    example: '',
  })
  @IsOptional()
  @IsString()
  payment_time: string;

  @ApiProperty({
    type: String,
    required: false,
    description: 'Почта клиента',
    example: 'example@gmail.com',
  })
  @IsNotEmpty()
  @IsString()
  @IsEmail()
  user_email: string;
}
