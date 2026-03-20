import { ApiProperty } from '@nestjs/swagger';

export class B24AddyIntegrationClientPaymentAddResponseDTO {
  @ApiProperty({
    type: Boolean,
    description: 'Результат обработки',
    example: true,
  })
  status: boolean;

  @ApiProperty({
    type: String,
    description: 'Описание ответа',
    example: 'Данные обработаны',
  })
  message: string;
}
