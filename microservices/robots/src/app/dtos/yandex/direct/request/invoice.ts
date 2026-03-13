import { IsNotEmpty, IsString, IsUrl } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IYandexDirectQueryParams } from '../../../../interfaces/yandex/direct/request/invoice.interface';

export class RobotsYandexDirectGetInvoiceQueryRequestDTO implements IYandexDirectQueryParams {
  @ApiProperty({
    type: String,
    description: 'url',
    required: true,
    example: 'https://yandex.direct.com/example',
  })
  @IsNotEmpty()
  @IsString()
  @IsUrl()
  invoice_url: string;
}
