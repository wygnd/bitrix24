import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPhoneNumber,
  IsString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class AvitoCreateLeadDto {
  @ApiProperty({
    type: [Number],
    description: 'user ids',
    required: true,
    example: [123, 456, 789],
  })
  @IsNotEmpty()
  @IsArray({ message: 'users must be an array' })
  @IsInt({ each: true, message: 'Invalid users field' })
  users: number[];

  @ApiProperty({
    type: [String],
    description: 'array messages',
    required: false,
    example: ['hello', 'world', '!'],
  })
  @IsOptional()
  @IsArray({ message: 'messages must be an array' })
  @IsString({ each: true, message: 'Invalid messages field' })
  messages: string[];

  @ApiProperty({
    type: String,
    description: 'Avito name',
    required: false,
    example: 'Авито Название авито',
  })
  @IsOptional()
  @IsString()
  avito: string = '';

  @ApiProperty({
    type: String,
    description: 'Phone number',
    required: true,
    example: '+79999999999',
  })
  @IsNotEmpty()
  @IsString()
  @IsPhoneNumber('RU')
  phone: string;

  @ApiProperty({
    type: String,
    description: 'Avito phone number',
    required: true,
    example: '+79999999999',
  })
  @IsNotEmpty()
  @IsString()
  avito_number: string;

  @ApiProperty({
    type: String,
    description: 'Region',
    required: false,
    example: 'Москва',
  })
  @IsOptional()
  @IsString()
  region: string = '';

  @ApiProperty({
    type: String,
    description: 'City',
    required: false,
    example: 'Город',
  })
  @IsOptional()
  @IsString()
  city: string = '';

  @ApiProperty({
    type: Number,
    description: 'Is ai get answer',
    required: false,
    default: 0,
    example: '1',
  })
  @IsOptional()
  @IsString()
  is_ai: string = '0';

  @ApiProperty({
    type: String,
    description: 'Client name',
    required: false,
    default: '',
    example: 'Кирил',
  })
  @IsOptional()
  @IsString()
  client_name: string = '';

  @ApiProperty({
    type: String,
    description: 'Services',
    required: false,
    example: 'Разработка сайта',
  })
  @IsOptional()
  @IsString()
  service_text: string = '';

  @ApiProperty({
    type: String,
    description: 'Date',
    required: false,
    default: '',
    example: '2025-10-25',
  })
  @IsOptional()
  @IsString()
  date: string = '';

  @ApiProperty({
    type: String,
    description: 'Time',
    required: false,
    default: '',
    example: '10:30',
  })
  @IsOptional()
  @IsString()
  time: string = '';
}
