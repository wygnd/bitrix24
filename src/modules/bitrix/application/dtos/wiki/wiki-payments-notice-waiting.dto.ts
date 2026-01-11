import { B24WikiPaymentsNoticeWaitingOptions } from '@/modules/bitrix/application/interfaces/wiki/wiki-payments-notice-waiting.inteface';
import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { B24_WIKI_PAYMENTS_ROLES_CHAT_IDS } from '@/modules/bitrix/application/constants/wiki/wiki-payments.constants';
import { Transform } from 'class-transformer';

export class B24WikiPaymentsNoticeWaitingDto implements B24WikiPaymentsNoticeWaitingOptions {
  @ApiProperty({
    type: String,
    description: 'bitrix ID пользователя',
    required: true,
    example: '376',
  })
  @IsNotEmpty()
  @IsString()
  user_bitrix_id: string;

  @ApiProperty({
    type: String,
    description: 'Организация',
    required: false,
    example: 'ООО "Компания"',
  })
  @IsNotEmpty()
  @IsString()
  name_of_org: string;

  @ApiProperty({
    type: String,
    description: 'ID сделки',
    required: false,
    example: '2039656',
  })
  @IsOptional()
  @IsString()
  deal_id?: string;

  @ApiProperty({
    type: String,
    description: 'ID лида',
    required: false,
    example: '234897',
  })
  @IsOptional()
  @IsString()
  lead_id?: string;

  @ApiProperty({
    type: String,
    description: 'роль пользователя: определяет, куда направить сообщение',
    required: false,
    example: 'ad_specialist',
  })
  @IsNotEmpty()
  @IsString()
  @Transform(
    ({ value }) => B24_WIKI_PAYMENTS_ROLES_CHAT_IDS[value] ?? 'unknown',
  )
  @IsString()
  @IsIn(Object.values(B24_WIKI_PAYMENTS_ROLES_CHAT_IDS), {
    message: `user_role must be one of the following values: ${Object.keys(B24_WIKI_PAYMENTS_ROLES_CHAT_IDS).join(', ')}`,
  })
  user_role: string;

  @ApiProperty({
    type: String,
    description: 'Сообщение',
    required: false,
    example:
      '[user=123]Имя Фамилия[/user] | [b]Продажа[/b]:Ожидание | [b]Первый аванс:[/b] 20 000 | 12345 | СБП |  | ',
  })
  @IsNotEmpty()
  @IsString()
  message: string;
}
