import { B24PlacementWidgetCallCardOptions } from '@/modules/bitrix/modules/placement/interfaces/placement-widget-call-card.interface';
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class B24PlacementWidgetCallCardDto implements B24PlacementWidgetCallCardOptions {
  @ApiProperty({
    type: String,
    description: '',
    required: true,
    example: '',
  })
  @IsNotEmpty()
  @IsString()
  AUTH_ID: string;

  @ApiProperty({
    type: String,
    description: '',
    required: true,
    example: '',
  })
  @IsNotEmpty()
  @IsString()
  AUTH_EXPIRES: string;

  @ApiProperty({
    type: String,
    description: '',
    required: true,
    example: '',
  })
  @IsNotEmpty()
  @IsString()
  REFRESH_ID: string;

  @ApiProperty({
    type: String,
    description: '',
    required: true,
    example: '',
  })
  @IsNotEmpty()
  @IsString()
  SERVER_ENDPOINT: string;

  @ApiProperty({
    type: String,
    description: '',
    required: true,
    example: '',
  })
  @IsNotEmpty()
  @IsString()
  member_id: string;

  @ApiProperty({
    type: String,
    description: '',
    required: true,
    example: '',
  })
  @IsNotEmpty()
  @IsString()
  status: string;

  @ApiProperty({
    type: String,
    description: '',
    required: true,
    example: '',
  })
  @IsNotEmpty()
  @IsString()
  PLACEMENT: string;

  @ApiProperty({
    type: String,
    description: '',
    required: true,
    example: '',
  })
  @IsNotEmpty()
  @IsString()
  PLACEMENT_OPTIONS: string;
}
