import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigAppModule } from './config/config.module';
import { RedisModule } from './modules/redis/redis.module';
import { BitrixModule } from './modules/bitirx/bitrix.module';
import { HttpLoggerMiddleware } from '@/common/middlewares/http-logger.middleware';
import { HeadHunterModule } from '@/modules/headhunter/headhunter.module';
import { AppController } from '@/app.controller';
import { QueueModule } from '@/modules/queue/queue.module';

@Module({
  imports: [ConfigAppModule, RedisModule, BitrixModule, HeadHunterModule],
  controllers: [AppController],
  providers: [],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(HttpLoggerMiddleware).forRoutes('*');
  }
}
