import { B24Deal } from '@/modules/bitrix/application/interfaces/deals/deals.interface';
import { ApiProperty } from '@nestjs/swagger';

export class B24DealDTO implements Partial<B24Deal> {
  @ApiProperty({
    type: String,
    description: 'ID сделки',
    required: true,
    example: '1234734',
  })
  ID: string;

  @ApiProperty({
    type: String,
    description: 'Название сделки',
    required: true,
    example: 'Сделка',
  })
  TITLE: string;

  @ApiProperty({
    type: String,
    description: 'ID типа сделки',
    required: true,
    example: '123324',
  })
  TYPE_ID: string;

  @ApiProperty({
    type: String,
    description: 'Стадия сделки',
    required: true,
    example: 'NEW',
  })
  STAGE_ID: string;
}
