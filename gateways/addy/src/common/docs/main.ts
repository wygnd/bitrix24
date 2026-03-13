import { NestExpressApplication } from '@nestjs/platform-express';
import { setupAppSwaggerDocumentation } from './swagger/main';

export const setupAppDocumentation = (app: NestExpressApplication) => {
  // Swagger
  setupAppSwaggerDocumentation(app);
};
