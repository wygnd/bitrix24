import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigAppModule } from './config/config.module';
import { RedisModule } from './modules/redis/redis.module';
import { BitrixModule } from './modules/bitirx/bitrix.module';
import { HttpLoggerMiddleware } from '@/common/middlewares/http-logger.middleware';
import { HeadHunterModule } from '@/modules/headhunter/headhunter.module';
import { AppController } from '@/app.controller';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AxiosGlobalInterceptor } from '@/common/interceptors/axios-interceptor';
import { QueueModule } from '@/modules/queue/queue.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

@Module({
  imports: [
    ConfigAppModule,
    RedisModule,
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'static'),
      useGlobalPrefix: true,
      exclude: ['/api'],
    }),
    BitrixModule,
    HeadHunterModule,
    // QueueModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: AxiosGlobalInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(HttpLoggerMiddleware).forRoutes('*');
  }
}
