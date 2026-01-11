import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty } from 'class-validator';
import { B24DealCategories } from '@/modules/bitrix/interfaces/bitrix.interface';
import { Expose, Type } from 'class-transformer';
import {
  B24LeadUpsellAttributes,
  B24LeadUpsellStatuses,
} from '@/modules/bitrix/application/interfaces/leads/lead-upsell.interface';

export class B24LeadUpsellRequestQueryDto {
  @ApiProperty({
    type: Number,
    description: 'Через сколько дней отправить уведомление о допродаже',
    required: true,
    example: 10,
  })
  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  notified: number;
}

export class B24LeadUpsellDto implements B24LeadUpsellAttributes {
  @ApiProperty({
    type: Number,
    description: 'Уникальный ID',
    required: true,
    example: 1,
  })
  @Expose()
  id: number;

  @ApiProperty({
    type: String,
    description: 'ID лида',
    required: true,
    example: '238745',
  })
  @Expose()
  leadId: string;

  @ApiProperty({
    type: String,
    description: 'ID сделки',
    required: true,
    example: '4359656',
  })
  @Expose()
  dealId: string;

  @ApiProperty({
    type: String,
    description: 'Статус допродажи',
    required: true,
    example: B24LeadUpsellStatuses.PENDING,
  })
  @Expose()
  status: B24LeadUpsellStatuses;

  @ApiProperty({
    type: String,
    description: 'Категория допродажи',
    required: true,
    example: B24DealCategories.SITE,
  })
  @Expose()
  category: B24DealCategories;

  @ApiProperty({
    type: Date,
    description: 'Дата уведомления о допродаже',
    required: true,
    example: new Date().toLocaleDateString(),
  })
  @Expose()
  dateNotify: Date;

  @ApiProperty({
    type: String,
    description: 'Стадия сделки',
    required: true,
    example: 'NEW',
  })
  @Expose()
  dealStage: string;
}
