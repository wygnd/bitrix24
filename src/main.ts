import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = app.get(ConfigService);

  const PORT = config.get<number>('PORT') ?? 3000;

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
        showExtensions: false,
        showCommonExtensions: false,
        displayRequestDuration: true,
        operationsSorter: 'alpha',
        tagsSorter: 'alpha',
        defaultModelsExpandDepth: -1,
        defaultModelExpandDepth: 0,
        tryItOutEnabled: true,
      },
    },
  );

  await app.listen(PORT);
}

bootstrap();
