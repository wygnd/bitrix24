import { BitrixAddySupportSendMessageResponse } from '@/modules/bitrix/modules/integration/addy/interfaces/addy-support-send-message.interface';
import { ApiProperty } from '@nestjs/swagger';

export class B24AddySupportSendMessageResponseDto implements BitrixAddySupportSendMessageResponse {
  @ApiProperty({
    type: Boolean,
    description: 'Статус отправки сообщения',
    example: true,
  })
  status: boolean;

  @ApiProperty({
    type: String,
    description: 'ID отправленного сообщения',
    example: '1723672340',
  })
  message: string;
}
