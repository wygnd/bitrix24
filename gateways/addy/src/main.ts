import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { setupAppVersioning } from './common/versioning/main';
import { config } from 'dotenv';
import { join } from 'path';
import { IS_PROD } from './shared/constants/app/main';
import { setupAppValidation } from './common/validation/main';
import { setupAppCors } from './common/cors/main';
import { setupAppCompression } from './common/compression/main';
import { setupAppDocumentation } from './common/docs/main';
import { ConfigService } from '@nestjs/config';
import { IEnvironmentOptions } from './shared/interfaces/config/main';
import { Logger } from '@nestjs/common';

config({
  debug: !IS_PROD,
  path: join(process.cwd(), '..', '..', '.env'),
  encoding: 'utf8',
});

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const config = app.get(ConfigService<IEnvironmentOptions>);
  const logger = new Logger('Application');

  // Версионирование
  setupAppVersioning(app);

  // Валидация данных
  setupAppValidation(app);

  // CORS
  setupAppCors(app);

  // Сжатие
  setupAppCompression(app);

  // Документация
  setupAppDocumentation(app);

  // Запросы /api/*
  app.setGlobalPrefix('api');

  const PORT = config.getOrThrow<string>('application.port', { infer: true });

  await app.listen(parseInt(PORT));
  logger.log(`Application started: http://localhost:${PORT}`);
}

bootstrap();
