import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import compression from 'compression';
import { NestExpressApplication } from '@nestjs/platform-express';
import { TimeoutInterceptor } from '@/common/interceptors/timeout.interceptor';
import { AllExceptionsFilter } from '@/common/filters/all-exceptions.filter';
import basicAuth from 'express-basic-auth';
import EventEmitter from 'node:events';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {});

  // enable versioning
  app.enableVersioning({
    type: VersioningType.URI,
  });

  const config = app.get(ConfigService);

  const PORT = config.get<number>('PORT') ?? 3000;

  // global interceptors
  app.useGlobalInterceptors(new TimeoutInterceptor());

  // global pipes
  app.useGlobalPipes(new ValidationPipe({ transform: true }));

  // global filters
  app.useGlobalFilters(new AllExceptionsFilter());

  // increase body json size
  app.useBodyParser('json', { limit: '10mb' });

  // enable cors
  app.enableCors({
    origin: [
      'https://bitrix-hr-app-production.up.railway.app',
      'http://localhost:5173',
    ],
  });

  // use compression
  app.use(compression());

  // Swagger API
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Grampus Bitrix24')
    .setDescription('The automatization process in bitrix24 for Grampus')
    .setVersion('1.0')
    .build();

  const apiUsername = config.get<string>('config.apiOptions.username');
  const apiPassword = config.get<string>('config.apiOptions.password');

  if (!apiUsername || !apiPassword)
    throw new Error('Invalid swagger options config');

  app.use(
    ['/api', '/api-json'],
    basicAuth({
      challenge: true,
      users: {
        [apiUsername]: apiPassword,
      },
    }),
  );

  SwaggerModule.setup(
    'api',
    app,
    () => SwaggerModule.createDocument(app, swaggerConfig),
    {
      swaggerOptions: {
        filter: true,
        docExpansion: 'none',
        // showExtensions: true,
        showCommonExtensions: false,
        displayRequestDuration: true,
        operationsSorter: 'alpha',
        tagsSorter: 'alpha',
      },
      customfavIcon: '/public/favicon.ico',
      customSiteTitle: 'Grampus Bitrix24',
    },
  );

  // reset default count max listeners
  // EventEmitter.defaultMaxListeners = 100;
  // app.use(EventEmitter);

  await app.listen(PORT);
}

bootstrap();
