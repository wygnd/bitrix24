import {
  IsArray,
  IsDate,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { UnloadLostCallingItem } from '@/modules/bitirx/modules/integration/wiki/interfaces/wiki-unload-lost-calling.interface';

export class UnloadLostCallingItemDto implements UnloadLostCallingItem {
  @ApiProperty({
    type: [String],
    description: 'Массив номеров',
    example: ['79395548535', '79773642722'],
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  // @IsPhoneNumber(undefined, { each: true })
  phone: string;

  @ApiProperty({})
  @IsNotEmpty()
  @IsString()
  @IsDateString()
  datetime: string;
}

export class UnloadLostCallingDto {
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
