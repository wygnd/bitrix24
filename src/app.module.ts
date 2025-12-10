import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { ConfigAppModule } from './config/config.module';
import { RedisModule } from './modules/redis/redis.module';
import { BitrixModule } from './modules/bitrix/bitrix.module';
import { HttpLoggerMiddleware } from '@/common/middlewares/http-logger.middleware';
import { HeadHunterModule } from '@/modules/headhunter/headhunter.module';
import { AppController } from '@/app.controller';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { AxiosGlobalInterceptor } from '@/common/interceptors/axios.interceptor';
import { WikiModule } from '@/modules/wiki/wiki.module';
import { AppHttModule } from '@/modules/http/http.module';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AvitoModule } from '@/modules/avito/avito.module';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { QueueModule } from '@/modules/queue/queue.module';
import { DatabaseModule } from '@/modules/database/database.module';
import { CronModule } from '@/modules/cron/cron.module';
import { TokensModule } from '@/modules/tokens/tokens.module';

@Module({
  imports: [
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 1000,
          limit: 30,
        },
      ],
      errorMessage: 'Too many requests',
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'static'),
      exclude: ['/api/{*test}'],
      serveStaticOptions: {
        cacheControl: true,
      },
      serveRoot: '/public',
    }),
    ConfigAppModule,
    RedisModule,
    DatabaseModule,
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
    CronModule,
    TokensModule,
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
