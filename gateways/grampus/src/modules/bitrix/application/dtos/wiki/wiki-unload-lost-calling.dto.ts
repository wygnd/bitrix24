import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { UnloadLostCallingItem } from '@/modules/bitrix/application/interfaces/wiki/wiki-unload-lost-calling.interface';

export class UnloadLostCallingItemDto implements UnloadLostCallingItem {
  @ApiProperty({
    type: String,
    description: 'Номер телефона',
    example: '79395548535',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  phone: string;

  @ApiProperty({
    type: String,
    description: 'Дата последнего звонка',
    example: '2025-11-20 15:11:45',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  datetime: string;
}

export class UnloadLostCallingDto {
  @ApiProperty({
    type: UnloadLostCallingItemDto,
    description:
      'Массив объектов с информацией: номер телефона, дата последнего звонка',
    isArray: true,
    example: UnloadLostCallingItemDto,
    required: true,
  })
  @IsNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => UnloadLostCallingItemDto)
  fields: UnloadLostCallingItemDto[];

  @ApiProperty({
    type: Number,
    description:
      'Флаг, указывающий нужно ли создавать лиды, если по номеру не удалось найтии',
    required: false,
    default: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  needCreate?: number;
}
