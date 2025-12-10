import {
  B24LanguageOptions,
  PlacementBindOptions,
} from '../placement.interface';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PlacementBindDto implements PlacementBindOptions {
  @ApiProperty({
    type: String,
    description: 'placement',
    required: true,
    example: 'CRM_LEAD_LIST_MENU',
  })
  @IsNotEmpty()
  @IsString()
  PLACEMENT: string;

  @ApiProperty({
    type: String,
    description: 'placement handler url',
    required: true,
    example: 'https://example.com/handler',
  })
  @IsNotEmpty()
  @IsString()
  HANDLER: string;

  @ApiProperty({
    type: String,
    description: 'placement title',
    required: true,
    example: 'Title',
  })
  @IsNotEmpty()
  @IsString()
  TITLE: string;

  @ApiProperty({
    type: Object,
    description: 'Placement locales',
    required: true,
    example: {
      ru: {
        title: 'Счетчик',
        description: 'Показывает счетчик товаров',
        group_name: 'product-counter',
      },
      en: {
        title: 'Counter',
        description: 'Show count products',
        group_name: 'product-counter',
      },
    },
  })
  @IsNotEmpty()
  LANG_ALL: Record<string, B24LanguageOptions>;

  @ApiProperty({
    type: String,
    description: 'Placement options',
    required: true,
    example: {
      errorHandlerUrl: 'http://myapp.com/error/',
    },
  })
  @IsOptional()
  OPTIONS?: Record<string, any>;
}