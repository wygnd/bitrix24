import { B24WikiNPaymentsNoticesResponse } from '@/modules/bitrix/application/interfaces/wiki/wiki-response.interface';
import { ApiProperty } from '@nestjs/swagger';

export class B24WikiPaymentsNoticesResponseDTO implements B24WikiNPaymentsNoticesResponse {
  @ApiProperty({
    type: Number,
    description: 'ID отправленного сообщения',
    required: true,
    example: 127362332,
  })
  message_id: number;
}
