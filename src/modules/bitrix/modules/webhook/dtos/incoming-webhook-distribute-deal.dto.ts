import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { B24DepartmentTypeId } from '@/modules/bitrix/application/interfaces/departments/departments.interface';

export class IncomingWebhookDistributeDealDto {
  @ApiProperty({
    type: String,
    description: 'deal id',
    required: true,
    example: 'D_1234',
  })
  @IsNotEmpty({ message: 'Deal id is required' })
  @Transform(({ value }) => value.split('_')[1])
  @IsString({ message: 'Deal id is must be a string' })
  deal_id: string;

  @ApiProperty({
    type: Number,
    description: 'is repeat webhook',
    required: true,
    example: 0,
    default: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'repeat field must be a number' })
  is_repeat?: number;

  @ApiProperty({
    type: String,
    description: 'department type',
    example: 'sites',
    enum: B24DepartmentTypeId,
  })
  @IsNotEmpty()
  @IsString()
  @IsEnum(B24DepartmentTypeId)
  department: B24DepartmentTypeId;

  @ApiProperty({
    type: String,
    description: 'Seo category',
    required: false,
    example: '12',
  })
  @IsNotEmpty()
  @IsString()
  category: string;

  @ApiProperty({
    type: String,
    description: 'Deal title',
    required: true,
    example: 'deal title',
  })
  @IsNotEmpty()
  @IsString()
  deal_title: string;
}
