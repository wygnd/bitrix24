import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { ConfigAppModule } from './config/config.module';
import { RedisModule } from './modules/redis/redis.module';
import { BitrixModule } from './modules/bitirx/bitrix.module';
import { HttpLoggerMiddleware } from '@/common/middlewares/http-logger.middleware';
import { HeadHunterModule } from '@/modules/headhunter/headhunter.module';
import { AppController } from '@/app.controller';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { AxiosGlobalInterceptor } from '@/common/interceptors/axios-interceptor';
import { WikiModule } from '@/modules/wiki/wiki.module';
import { AppHttModule } from '@/modules/http/http.module';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AvitoModule } from '@/modules/avito/avito.module';
import { QueueModule } from '@/modules/queue/queue.module';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';

@Module({
  imports: [
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 10000,
          limit: 5,
        },
      ],
      errorMessage: 'Too many requests',
    }),
    // ServeStaticModule.forRoot({
    //   rootPath: join(__dirname, '..', 'static'),
    //   renderPath: '/public',
    //   serveStaticOptions: {
    //     cacheControl: true,
    //   },
    // }),
    ConfigAppModule,
    RedisModule,
    BitrixModule,
    HeadHunterModule,
    WikiModule,
    AppHttModule,
    AvitoModule,
    QueueModule,
    PrometheusModule.register({
      defaultLabels: {
        enabled: true,
      },
    }),
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: AxiosGlobalInterceptor,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(HttpLoggerMiddleware).forRoutes({
      path: '*',
      method: RequestMethod.ALL,
    });
  }
}
