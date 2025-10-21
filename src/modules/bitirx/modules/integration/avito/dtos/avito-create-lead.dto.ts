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

export class AvitoCreateLeadDto {
  @IsNotEmpty()
  @IsArray({ message: 'users must be an array' })
  @IsInt({ each: true, message: 'Invalid users field' })
  users: number[];

  @IsOptional()
  @IsArray({ message: 'messages must be an array' })
  @IsString({ each: true, message: 'Invalid messages field' })
  messages: string[];

  @IsOptional()
  @IsString()
  avito: string = '';

  @IsNotEmpty()
  @IsString()
  @IsPhoneNumber('RU')
  phone: string;

  @IsNotEmpty()
  @IsString()
  avito_number: string;

  @IsOptional()
  @IsString()
  region: string = '';

  @IsOptional()
  @IsString()
  city: string = '';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  is_ai: number = 0;

  @IsOptional()
  @IsString()
  client_name: string = '';

  @IsOptional()
  @IsString()
  service_text: string = '';

  @IsOptional()
  @IsString()
  date: string = '';

  @IsOptional()
  @IsString()
  time: string = '';
}
