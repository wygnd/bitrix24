import { BitrixWikiPaymentsNoticeExpenseOptions } from '@/modules/bitrix/application/interfaces/wiki/wiki-payments-notice-expense.interface';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class BitrixWikiPaymentsNoticeExpenseDto implements BitrixWikiPaymentsNoticeExpenseOptions {
  @ApiProperty({
    type: String,
    description: 'Сообщение',
    required: true,
    example: 'Новый расход',
  })
  @IsNotEmpty()
  @IsString()
  message: string;

  @ApiProperty({
    type: String,
    description: 'Отправлять ли параллельно в другой чат',
    required: false,
    example: '1',
  })
  @IsOptional()
  @IsString()
  extra_chat_id?: string;
}
