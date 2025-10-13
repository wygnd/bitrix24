import { Module } from '@nestjs/common';
import { ConfigAppModule } from './config/config.module';
import { BitrixModule } from './modules/bitirx/bitrix.module';
import { ApplicationLoggerModule } from './modules/logger/logger.module';

@Module({
  imports: [ConfigAppModule, BitrixModule, ApplicationLoggerModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
