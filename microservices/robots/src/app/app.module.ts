import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { YandexDirectInvoiceService } from './services/yandex/direct/invoice.service';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [YandexDirectInvoiceService],
})
export class AppModule {}
