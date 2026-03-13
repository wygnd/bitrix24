import { INestMicroservice } from '@nestjs/common';
import { AllExceptionsFilter } from '../../shared/filters/all-exception.filter';

export const setupAppFilters = (app: INestMicroservice) => {
  app.useGlobalFilters(new AllExceptionsFilter());
};
