import { Module } from '@nestjs/common';
import { httpProviders } from '@/modules/http/http.providers';
import { AppHttpService } from '@/modules/http/http.service';

@Module({
  imports: [],
  providers: [...httpProviders, AppHttpService],
  exports: [AppHttpService],
})
export class AppHttModule {}
