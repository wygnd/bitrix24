import {
  BitrixGrampusSiteRequestReceive,
  BitrixGrampusSiteRequestReceiveResponse,
} from '@/modules/bitrix/application/interfaces/grampus/bitrix-site-request.interface';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class BitrixGrampusSiteRequestReceiveDTO implements BitrixGrampusSiteRequestReceive {
  @ApiProperty({
    type: String,
    description: 'Номер телефона',
    required: true,
    example: '+7 (999) 999-99-99',
  })
  @IsNotEmpty()
  @IsOptional()
  phone: string;

  @ApiProperty({
    type: String,
    description: 'https://example.com/about',
    required: true,
    example: 'Ссылка, с которой клиент оставил заявку',
  })
  @IsNotEmpty()
  @IsString()
  url: string;

  @ApiProperty({
    type: String,
    description: 'Имя клиента',
    required: false,
    example: 'Андрей',
  })
  @IsOptional()
  @IsString()
  clientName?: string;

  @ApiProperty({
    type: String,
    description: 'Комментарий',
    required: false,
    example: 'Комментарий',
  })
  @IsOptional()
  @IsString()
  comment?: string;
}

export class BitrixGrampusSiteRequestReceiveResponseDTO implements BitrixGrampusSiteRequestReceiveResponse {
  @ApiProperty({
    type: Boolean,
    description: 'Статус ответа',
    required: true,
    example: true,
  })
  status: true;

  @ApiProperty({
    type: String,
    description: 'Описание ответа',
    required: true,
    example: 'Successfully update lead',
  })
  message: string;
}
