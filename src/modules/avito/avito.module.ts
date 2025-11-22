import { Module } from '@nestjs/common';
import { avitoProviders } from '@/modules/avito/avito.providers';
import { AvitoApiService } from '@/modules/avito/avito-api.service';
import { AvitoService } from '@/modules/avito/avito.service';

@Module({
  providers: [...avitoProviders, AvitoApiService, AvitoService],
  exports: [AvitoService],
})
export class AvitoModule {}
