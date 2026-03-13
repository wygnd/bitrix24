import { Module } from '@nestjs/common';
import { BitrixModule } from './modules/bitrix/module';
import { ConfigModule } from '@nestjs/config';
import { configList } from '../common/config/main';
import { AppController } from './controllers/controller';
import { RedisModule } from './modules/redis/module';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: configList,
    }),
    BitrixModule,
    RedisModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
