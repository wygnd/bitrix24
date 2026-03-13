import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { config } from 'dotenv';
import { join } from 'path';
import { IS_PROD } from './common/config/main';
import { setupListenAppErrors } from './common/events/error';
import { setupAppInterceptors } from './common/interceptors/main';
import { setupAppPipes } from './common/pipes/main';
import { setupAppFilters } from './common/filters/main';

config({
  debug: !IS_PROD,
  path: join(process.cwd(), '..', '..', '.env'),
  encoding: 'utf8',
});

async function bootstrap() {
  const host = process.env.MICROSERVICES_ROBOTS_HOST;

  if (!host) throw new Error('Host is required');

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.REDIS,
      options: {
        host: host,
        port: 6379,
      },
    },
  );

  // Добавляем валидацию
  setupAppPipes(app);

  // Добавляем перехватчики
  setupAppInterceptors(app);

  // Добавляем фильтры
  setupAppFilters(app);

  // Добавляем логирование ошибок
  setupListenAppErrors(app);

  await app.listen();
}
bootstrap();
