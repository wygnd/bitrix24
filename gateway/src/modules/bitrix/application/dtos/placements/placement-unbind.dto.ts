import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PlacementUnbindOptions } from '@/modules/bitrix/application/interfaces/placements/placement.interface';

export class PlacementUnbindDto implements PlacementUnbindOptions {
  @ApiProperty({
    type: String,
    description: 'placement',
    required: true,
    example: 'CRM_DEAL_DETAIL_TAB'
  })
  @IsNotEmpty()
  @IsString()
  PLACEMENT: string;

  @ApiProperty({
    type: String,
    description: 'placement handler url',
    required: true,
    example: 'https://exmaple.com/handler'
  })
  @IsNotEmpty()
  @IsString()
  HANDLER: string;
}