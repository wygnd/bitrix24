import { BitrixAddyPaymentsSendMessageResponse } from '@/modules/bitrix/modules/integration/addy/interfaces/addy-payments-send-message.interface';
import { ApiProperty } from '@nestjs/swagger';

export class B24AddyPaymentsSendMessageResponseDto implements BitrixAddyPaymentsSendMessageResponse {
  @ApiProperty({
    type: Boolean,
    description: 'Статус отправки сообщения',
    example: true,
  })
  status: boolean;

  @ApiProperty({
    type: String,
    description: 'ID отправленного сообщения',
    example: '123746357',
  })
  message: string;
}
