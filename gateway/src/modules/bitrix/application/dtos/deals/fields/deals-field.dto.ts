import { BitrixDealsFieldOptions } from '@/modules/bitrix/application/interfaces/deals/fields/deals-field.interface';
import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class BitrixDealsFieldOptionsDTO implements BitrixDealsFieldOptions {
  @ApiProperty({
    type: String,
    description: 'ID чата, куда будет отправляться сообщение о ',
    required: false,
    example: '123',
  })
  @IsNotEmpty()
  @IsString()
  chat_id: string;
}
