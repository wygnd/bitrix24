import { NestExpressApplication } from '@nestjs/platform-express';
import compression from 'compression';

export const setupAppCompression = (app: NestExpressApplication) => {
  app.use(compression());
};
