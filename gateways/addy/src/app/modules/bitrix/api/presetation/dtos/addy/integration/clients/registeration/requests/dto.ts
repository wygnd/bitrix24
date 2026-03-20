import { ApiProperty } from '@nestjs/swagger';
import { IB24AddyIntegrationRegisterClientRequest } from '../../../../../../../application/interfaces/addy/integration/clients/registration/requests/interface';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsPhoneNumber,
  IsString,
} from 'class-validator';

export class B24AddyIntegrationRegisterClientRequestDTO implements IB24AddyIntegrationRegisterClientRequest {
  @ApiProperty({
    type: String,
    description: 'Электронная почта клиента',
    required: true,
    example: 'example@gmail.com',
  })
  @IsNotEmpty()
  @IsString()
  @IsEmail()
  email: string;

  @ApiProperty({
    type: String,
    description: 'Имя клиента',
    required: true,
    example: 'Илья',
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    type: String,
    description: 'Фамилия клиента',
    required: true,
    example: 'Новиков',
  })
  @IsOptional()
  @IsString()
  last_name: string;

  @ApiProperty({
    type: String,
    description: 'Номер телефона клиента',
    required: true,
    example: '+79212345212',
  })
  @IsNotEmpty()
  @IsString()
  @IsPhoneNumber()
  phone: string;

  @ApiProperty({
    type: String,
    description: 'ID пользователя в системе Addy',
    required: true,
    example: '12',
  })
  @IsNotEmpty()
  @IsString()
  user_id: string;
}
