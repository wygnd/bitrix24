import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { B24ImbotUnRegisterOptions } from '@/modules/bitrix/application/interfaces/bot/imbot.interface';

export class ImbotUnregisterDto implements B24ImbotUnRegisterOptions {
  @ApiProperty({
    type: String,
    description: 'bot id',
    required: true,
    example: '1234',
  })
  @IsNotEmpty()
  @IsString()
  BOT_ID: string;

  @ApiProperty({
    type: String,
    description: 'client id',
    required: false,
    example: '467',
    default: '',
  })
  @IsOptional()
  @IsString()
  CLIENT_ID: string = '';
}
