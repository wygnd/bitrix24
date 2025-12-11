import {
  B24WikiPaymentsNoticeWaitingOptions,
  B24WikiPaymentsNoticeWaitingRequestOptions,
} from '@/modules/bitrix/modules/integration/wiki/interfaces/wiki-payments-notice-waiting.inteface';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { B24_WIKI_PAYMENTS_ROLES_CHAT_IDS } from '@/modules/bitrix/modules/integration/wiki/constants/wiki-payments.constants';
import { Transform } from 'class-transformer';

class B24PaymentsNoticeWaitingRequestDto implements B24WikiPaymentsNoticeWaitingRequestOptions {
  @ApiProperty({
    type: String,
    description: 'роль пользователя: определяет, куда направить сообщение',
    required: false,
    example: 'ad_specialist',
  })
  @IsNotEmpty()
  @IsString()
  @IsIn(Object.keys(B24_WIKI_PAYMENTS_ROLES_CHAT_IDS))
  @Transform(({ value }) => B24_WIKI_PAYMENTS_ROLES_CHAT_IDS[value])
  user_role: string;

  @ApiProperty({
    type: String,
    description: 'ID лида',
    required: false,
    example: '234897',
  })
  @IsOptional()
  @IsString()
  lead_id?: string;
}

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
    type: B24PaymentsNoticeWaitingRequestDto,
    required: true,
  })
  @IsNotEmpty()
  @ValidateNested()
  request: B24PaymentsNoticeWaitingRequestDto;

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
