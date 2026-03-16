import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { BitrixModule } from './modules/bitrix/module';
import { ConfigModule } from '@nestjs/config';
import { configList } from '../common/config/main';
import { AppController } from './controllers/controller';
import { RedisModule } from './modules/redis/module';
import { HttpLoggerMiddleware } from '@shared/middlewares/http-logger.middleware';
import { join } from 'path';
import { ServeStaticModule } from '@nestjs/serve-static';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: configList,
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', '..', 'static'),
      exclude: ['/api/*path'],
      serveStaticOptions: {
        cacheControl: true,
      },
      serveRoot: '/public',
    }),
    BitrixModule,
    RedisModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(HttpLoggerMiddleware).forRoutes('/*path');
  }
}
