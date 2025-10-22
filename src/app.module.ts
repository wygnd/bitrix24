import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigAppModule } from './config/config.module';
import { RedisModule } from './modules/redis/redis.module';
import { AppHttpModule } from './modules/http/http.module';
import { BitrixModule } from './modules/bitirx/bitrix.module';
import { ApplicationLoggerModule } from '@/modules/logger/logger.module';
import { HttpLoggerMiddleware } from '@/common/middlewares/http-logger.middleware';

@Module({
  imports: [ConfigAppModule, RedisModule, AppHttpModule, BitrixModule],
  controllers: [],
  providers: [],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(HttpLoggerMiddleware).forRoutes('*');
  }
}
