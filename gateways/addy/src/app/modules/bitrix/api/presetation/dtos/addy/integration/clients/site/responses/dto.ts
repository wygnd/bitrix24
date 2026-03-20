import { ApiProperty } from '@nestjs/swagger';

export class B24AddyIntegrationClientSiteFormSendResponseDTO {
  @ApiProperty({
    type: Boolean,
    description: 'Результат обработки',
    example: true,
  })
  status: boolean;

  @ApiProperty({
    type: String,
    description: 'Описание ответа',
    example: 'Заявка отправлена',
  })
  message: string;
}
