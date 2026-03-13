import { INestMicroservice } from '@nestjs/common';
import { LoggerInterceptor } from '../../shared/interceptors/logger/main';

export const setupAppInterceptors = (app: INestMicroservice) => {
  app.useGlobalInterceptors(new LoggerInterceptor());
};
