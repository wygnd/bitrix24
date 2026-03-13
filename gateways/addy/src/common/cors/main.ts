import { NestExpressApplication } from '@nestjs/platform-express';

export const setupAppCors = (app: NestExpressApplication) => {
  app.enableCors({});
};
