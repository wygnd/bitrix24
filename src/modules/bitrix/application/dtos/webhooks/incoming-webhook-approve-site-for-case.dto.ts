import {
  IsBoolean,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class IncomingWebhookApproveSiteForCase {
  @ApiProperty({
    type: String,
    description: '',
    required: true,
    example: '376',
  })
  @IsNotEmpty()
  @Transform(({ value }) => value.split('_')[1])
  @IsString({ message: 'invalid assignedId' })
  assignedId: string;

  @ApiProperty({
    type: String,
    description: 'site type: crm field in deals card',
    required: true,
    example: 'Каталог Услуг уникальный',
  })
  @IsNotEmpty()
  @IsString()
  @IsIn([
    'Лендинг уникальный',
    'Каталог Товаров уникальный',
    'Каталог Услуг уникальный',
    'Интернет магазин уникальный',
    'Большой проект (не типовой)',
  ])
  siteType: string;

  @ApiProperty({
    type: Boolean,
    description: '',
    required: false,
    example: false,
    default: false,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  ignored: boolean = false;
}
