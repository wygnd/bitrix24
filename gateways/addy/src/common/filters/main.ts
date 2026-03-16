import { NestExpressApplication } from '@nestjs/platform-express';
import { ExceptionsFilter } from '@shared/filters/exceptions.filter';

export const setupAppFilters = (app: NestExpressApplication) => {
  app.useGlobalFilters(new ExceptionsFilter());
};
