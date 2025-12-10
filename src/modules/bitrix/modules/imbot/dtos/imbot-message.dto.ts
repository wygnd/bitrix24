import type {
  B24ImKeyboardOptions,
  KeyboardBgColorToken,
} from '@/modules/bitrix/modules/im/interfaces/im.interface';
import {
  IsHexColor,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ImbotMessageKeyboardOptionsDto implements B24ImKeyboardOptions {
  @ApiProperty({
    type: String,
    description: 'button name',
    required: true,
    example: 'echo',
  })
  @IsNotEmpty()
  @IsString()
  TEXT: string;

  @ApiProperty({
    type: String,
    description: 'button link if is link',
    required: false,
    example: 'https://example.com/',
    default: '',
  })
  @IsOptional()
  @IsString()
  LINK: string = '';

  @ApiProperty({
    type: String,
    description: 'button command',
    required: false,
    default: '',
    example: 'echo',
  })
  @IsOptional()
  @IsString()
  COMMAND: string = '';

  @ApiProperty({
    type: String,
    description: 'button color',
    required: false,
    example: 'alert',
    default: 'primary',
  })
  @IsOptional()
  @IsString()
  BG_COLOR_TOKEN: KeyboardBgColorToken = 'primary';

  @ApiProperty({
    type: String,
    description: 'button color as hex code',
    required: false,
    example: '#016e8732',
    default: '',
  })
  @IsOptional()
  @IsString()
  @IsHexColor()
  BG_COLOR: string = '';

  @ApiProperty({
    type: String,
    description: 'block button after click',
    required: false,
    example: 'Y',
    default: 'N',
  })
  @IsOptional()
  @IsString()
  @IsIn(['Y', 'N'])
  BLOCK: 'Y' | 'N' = 'N';

  @ApiProperty({
    type: String,
    description: 'is disabled button',
    required: false,
    example: 'Y',
    default: 'N',
  })
  @IsOptional()
  @IsString()
  @IsIn(['Y', 'N'])
  DISABLED: 'Y' | 'N';

  @ApiProperty({
    type: String,
    description: 'text color as hex code',
    required: false,
    example: '#016e8732',
    default: '',
  })
  @IsOptional()
  @IsString()
  @IsHexColor()
  TEXT_COLOR: '';

  @ApiProperty({
    type: String,
    description: 'button is displayed in all line or not',
    required: false,
    example: 'LINE',
    default: 'LINE',
  })
  @IsOptional()
  @IsString()
  @IsIn(['BLOCK', 'LINE'])
  DISPLAY: 'BLOCK' | 'LINE' = 'LINE';

  @ApiProperty({
    type: String,
    description: 'button width',
    example: '250px',
    default: '',
  })
  @IsOptional()
  @IsString()
  WIDTH: string = '';
}
