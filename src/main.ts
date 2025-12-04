import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import compression from 'compression';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  process.env.TZ = 'Europe/Moscow';

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {});

  const config = app.get(ConfigService);

  const PORT = config.get<number>('PORT') ?? 3000;

  app.useGlobalPipes(new ValidationPipe({ transform: true }));

  app.useBodyParser('json', { limit: '10mb' });

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
        // defaultModelsExpandDepth: -1,
        // defaultModelExpandDepth: 0,
      },
      customfavIcon: './favicon.ico',
      customSiteTitle: 'Grampus Bitrix24',
    },
  );

  await app.listen(PORT);
}

bootstrap();
