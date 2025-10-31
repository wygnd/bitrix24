import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PlacementRequestDto {
  @ApiProperty({
    type: String,
    required: true,
    description: '',
    example: 'domain.bitrix.com',
  })
  @IsNotEmpty()
  @IsString()
  DOMAIN: string;

  @ApiProperty({
    type: String,
    required: true,
    description: 'protocol',
    example: '1',
  })
  @IsNotEmpty()
  @IsString()
  PROTOCOL: string;

  @ApiProperty({
    type: String,
    required: true,
    description: 'site lang',
    example: 'en',
  })
  @IsNotEmpty()
  @IsString()
  LANG: string;

  @ApiProperty({
    type: String,
    required: true,
    description: 'app sid',
    example: 'd17a24f20960a2971eda0e69754e62a2',
  })
  @IsNotEmpty()
  @IsString()
  APP_SID: string;

  @ApiProperty({
    type: String,
    required: true,
    description: 'auth id',
    example:
      '57f49f6600631fcd00005a4b00000001f0f1077ef2d8b6c37097b8985bb7fb4948d1e8',
  })
  @IsNotEmpty()
  @IsString()
  AUTH_ID: string;

  @ApiProperty({
    type: String,
    required: true,
    description: 'expires token',
    example: '3600',
  })
  @IsNotEmpty()
  @IsString()
  AUTH_EXPIRES: number;

  @ApiProperty({
    type: String,
    required: true,
    description: 'refresh id',
    example:
      '4773c76600631fcd00005a4b00000001f0f10711f2f134f53a44072e44b61677961fac',
  })
  @IsNotEmpty()
  @IsString()
  REFRESH_ID: string;

  @ApiProperty({
    type: String,
    required: true,
    description: 'member id',
    example: 'da45a03b265edd8787f8a258d793cc5d',
  })
  @IsNotEmpty()
  @IsString()
  member_id: string;

  @ApiProperty({
    type: String,
    required: true,
    description: 'status',
    example: 'L',
  })
  @IsNotEmpty()
  @IsString()
  status: string;

  @ApiProperty({
    type: String,
    required: true,
    description: 'placement',
    example: 'CRM_CONTACT_DETAIL_TAB',
  })
  @IsNotEmpty()
  @IsString()
  PLACEMENT: string;

  @ApiProperty({
    type: String,
    required: true,
    description: 'placement options',
    example: '',
  })
  @IsNotEmpty()
  @IsString()
  PLACEMENT_OPTIONS: string;

  @ApiProperty({
    type: String,
    required: true,
    description: 'server endpoint',
    example: 'https://server.ru/ednpoint',
  })
  @IsNotEmpty()
  @IsString()
  SERVER_ENDPOINT: string;
}
