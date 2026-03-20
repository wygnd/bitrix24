import { IB24AddyClientEntity } from '../../../../../../../application/interfaces/addy/integration/clients/entities/entity';
import type { TB24AddyClientStatus } from '../../../../../../../application/interfaces/addy/integration/clients/entities/entity';
import { Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class B24AddyClientEntityDTO implements IB24AddyClientEntity {
  @Expose()
  @ApiProperty({
    type: Number,
    description: 'ID пользователя',
    example: 1,
  })
  id: number;

  @Expose()
  @ApiProperty({
    type: String,
    description: 'Email пользователя',
    example: 'google@gmail.com',
  })
  email: string;

  @Expose()
  @ApiProperty({
    type: String,
    description: 'Полное имя клиента',
    example: 'Иван Иванов',
  })
  name: string;

  @Expose()
  @ApiProperty({
    type: Boolean,
    description: 'Создавал ли клиент договоры',
    example: false,
  })
  hasFirstContract: boolean;

  @Expose()
  checkIn: string | null;

  @Expose()
  wasHandled: boolean;

  @Expose()
  status: TB24AddyClientStatus | null;

  @Expose()
  @ApiProperty({
    type: String,
    description: 'Дата обновления',
    example: new Date().toISOString(),
  })
  updatedAt: string;

  @Expose()
  @ApiProperty({
    type: String,
    description: 'Дата создания',
    example: new Date().toISOString(),
  })
  createdAt: string;
}
