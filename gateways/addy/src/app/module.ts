import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { BitrixModule } from './modules/bitrix/module';
import { ConfigModule } from '@nestjs/config';
import { configList } from '../common/config/main';
import { AppController } from './controllers/controller';
import { RedisModule } from './modules/redis/module';
import { HttpLoggerMiddleware } from '@shared/middlewares/http-logger.middleware';

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
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(HttpLoggerMiddleware).forRoutes({
      path: '*',
      method: RequestMethod.ALL,
    });
  }
}
