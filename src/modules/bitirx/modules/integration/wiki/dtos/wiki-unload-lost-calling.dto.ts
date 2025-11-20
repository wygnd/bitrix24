import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class UnloadLostCallingDto {
  @ApiProperty({
    type: [String],
    description: 'Массив номеров',
    example: ['79395548535', '79773642722'],
    required: true,
  })
  @IsNotEmpty()
  @IsArray()
  @IsString({ each: true })
  // @IsPhoneNumber(undefined, { each: true })
  phones: string[];

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
