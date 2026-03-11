import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { config } from 'dotenv';
import { join } from 'path';
import { LoggerInterceptor } from './share/interceptors/logger.interceptor';
import { AllExceptionsFilter } from './share/filters/all-exception.filter';

config({
  debug: process.env.NODE_ENV !== 'production',
  path: join(process.cwd(), '..', '..', '.env'),
  encoding: 'utf8',
});

async function bootstrap() {
  if (!process.env.MICROSERVICES_NEURO_PORT)
    throw new Error('PORT is required');

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.TCP,
      options: {
        port: parseInt(process.env.MICROSERVICES_NEURO_PORT),
      },
    },
  );

  // Interceptors
  app.useGlobalInterceptors(new LoggerInterceptor());

  // Filters
  app.useGlobalFilters(new AllExceptionsFilter());

  await app.listen();
}

bootstrap();
