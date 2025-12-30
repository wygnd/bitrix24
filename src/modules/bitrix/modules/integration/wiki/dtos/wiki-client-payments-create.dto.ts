import { B24WikiClientPaymentsCreationalAttributes } from '@/modules/bitrix/modules/integration/wiki/interfaces/wiki-client-payments.interface';
import { IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class B24WikiClientPaymentsCreateDto implements B24WikiClientPaymentsCreationalAttributes {
  @ApiProperty({
    type: String,
    description: 'ИНН',
    example: '874635876435687',
  })
  @IsNotEmpty()
  inn: string;

  @ApiProperty({
    type: String,
    description: 'ID отдела, с которым работал клиент',
    example: '12763324',
  })
  departmentId: number;

  @ApiProperty({
    type: String,
    description: 'Название отдела',
    example: 'Отдел разработки',
  })
  departmentName: string;
}
