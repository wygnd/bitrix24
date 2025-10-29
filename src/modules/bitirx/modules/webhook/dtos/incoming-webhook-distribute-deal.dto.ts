import { IncomingWebhookDto } from '@/modules/bitirx/modules/webhook/dtos/incoming-webhook.dto';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { IncomingWebhookDepartment } from '@/modules/bitirx/modules/webhook/interfaces/webhook.interface';

export class IncomingWebhookDistributeDealDto extends IncomingWebhookDto {
  @ApiProperty({
    type: String,
    description: 'deal id',
    required: true,
    example: 'D_1234',
  })
  @IsNotEmpty({ message: 'Deal id is required' })
  @IsString({ message: 'Deal id is must be a string' })
  deal_id: string;

  @ApiProperty({
    type: String,
    description: 'chat id',
    required: true,
    example: 'chat12354',
  })
  @IsNotEmpty({ message: 'Chat id is required' })
  @IsString({ message: 'Chat id is must be a string' })
  dialog_id: string;

  @ApiProperty({
    type: Number,
    description: 'is repeat webhook',
    required: true,
    example: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'repeat field must be a number' })
  is_repeat: number;

  @ApiProperty({
    type: String,
    description: 'department type',
    example: 'sites',
    enum: IncomingWebhookDepartment,
  })
  @IsNotEmpty()
  @IsString()
  @IsEnum(IncomingWebhookDepartment)
  department: IncomingWebhookDepartment;

  @ApiProperty({
    type: String,
    description: 'Seo category',
    required: false,
    example: 'base',
  })
  @IsOptional()
  @IsString()
  seo_category?: string;

  @ApiProperty({
    type: Number,
    description: 'Seo department id',
    required: false,
    example: 43,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'seo department field must be a number' })
  seo_department?: number;

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
