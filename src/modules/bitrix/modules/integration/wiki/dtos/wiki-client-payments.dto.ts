import { B24WikiClientPaymentsAttributes } from '@/modules/bitrix/modules/integration/wiki/interfaces/wiki-client-payments.interface';
import { Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class B24WikiClientPaymentsPaymentDto implements B24WikiClientPaymentsAttributes {
  @Expose()
  @ApiProperty({
    type: Number,
    description: 'ID записи',
    example: 1,
  })
  id: number;

  @Expose()
  @ApiProperty({
    type: String,
    description: 'ИНН клиента',
    example: '87923647832',
  })
  inn: string;

  @Expose()
  @ApiProperty({
    type: Number,
    description: 'ID отдела, с которым работал клиент',
    example: 1,
  })
  departmentId: number;

  @Expose()
  @ApiProperty({
    type: String,
    description: 'Название отдела',
    example: 'Отдел разработки',
  })
  departmentName: string;

  @Expose()
  @ApiProperty({
    type: String,
    description: 'Дата создания записи',
    example: new Date().toISOString(),
  })
  createdAt: Date;

  @Expose()
  @ApiProperty({
    type: String,
    description: 'Дата обновления записи',
    example: new Date().toISOString(),
  })
  updatedAt: Date;
}
