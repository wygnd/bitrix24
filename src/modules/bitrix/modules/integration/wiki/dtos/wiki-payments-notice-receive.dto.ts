import { B24WikiPaymentsNoticeReceiveOptions } from '@/modules/bitrix/modules/integration/wiki/interfaces/wiki-payments-notice-receive.inteface';
import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { B24_WIKI_PAYMENTS_CHAT_IDS_BY_GROUP } from '@/modules/bitrix/modules/integration/wiki/constants/wiki-payments.constants';

export class B24WikiPaymentsNoticeReceiveDto implements B24WikiPaymentsNoticeReceiveOptions {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  message: string;

  @ApiProperty()
  @IsOptional()
  @Transform(({ value }) =>
    value in B24_WIKI_PAYMENTS_CHAT_IDS_BY_GROUP
      ? B24_WIKI_PAYMENTS_CHAT_IDS_BY_GROUP[value]
      : B24_WIKI_PAYMENTS_CHAT_IDS_BY_GROUP[0],
  )
  @IsString()
  @IsIn(Object.values(B24_WIKI_PAYMENTS_CHAT_IDS_BY_GROUP))
  group: string;
}
