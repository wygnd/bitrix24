import { IsNotEmpty, IsString, IsUrl } from 'class-validator';
import { IRobotsYandexDirectQueryParams } from '@/shared/microservices/modules/robots/interfaces/yandex/direct/request/invoice.interface';
import { ApiProperty } from '@nestjs/swagger';

export class RobotsYandexDirectGetInvoiceQueryRequest implements IRobotsYandexDirectQueryParams {
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
