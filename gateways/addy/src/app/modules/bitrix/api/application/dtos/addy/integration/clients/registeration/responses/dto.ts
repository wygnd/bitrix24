import { ApiProperty } from '@nestjs/swagger';
import {
  IB24AddyIntegrationRegisterClientResponse
} from '../../../../../../interfaces/addy/integration/clients/registration/responses/interface';

export class B24AddyIntegrationRegisterClientResponseDTO implements IB24AddyIntegrationRegisterClientResponse {
  @ApiProperty({
    type: Boolean,
    description: 'Статус обработки',
    example: true,
  })
  status: boolean;

  @ApiProperty({
    type: String,
    description: 'Дополнительная информация',
    example: 'Данные отправлены',
  })
  message: string;
}
