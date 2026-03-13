import { MessagePattern, Payload } from '@nestjs/microservices';
import { Controller } from '@nestjs/common';
import { RobotsYandexDirectGetInvoiceQueryRequestDTO } from './dtos/yandex/direct/request/invoice';
import { YandexDirectInvoiceService } from './services/yandex/direct/invoice.service';

@Controller()
export class AppController {
  constructor(
    private readonly yandexDirectInvoiceService: YandexDirectInvoiceService,
  ) {}

  @MessagePattern({ cmd: 'health' })
  getHello() {
    return {
      status: true,
      timestamp: new Date().toISOString(),
    };
  }

  @MessagePattern({ cmd: 'yandex.direct.get.invoice' })
  async getYandexDirectInvoice(
    @Payload() data: RobotsYandexDirectGetInvoiceQueryRequestDTO,
  ) {
    return this.yandexDirectInvoiceService.getInvoiceNumber(data);
  }
}
