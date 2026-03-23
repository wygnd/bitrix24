import { IsNotEmpty, IsString } from 'class-validator';
import {
  IBitrixRobotsYandexDirectInvoiceRequest
} from '@/modules/bitrix/application/interfaces/robots/yandex/direct/robots-invoice-request.interface';
import { ApiProperty } from '@nestjs/swagger';

export class BitrixRobotsYandexDirectInvoiceRequest implements IBitrixRobotsYandexDirectInvoiceRequest {
  @ApiProperty({
    type: String,
    description: 'Ссылка на выставление счета',
    example: 'https://example.com',
    required: true,
  })
  @IsNotEmpty({ message: 'invoice_url обязательна' })
  @IsString({ message: 'invoice_url должна быть строкой' })
  invoice_url: string;
}
