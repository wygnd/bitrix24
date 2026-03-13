import { NestExpressApplication } from '@nestjs/platform-express';
import { VersioningType } from '@nestjs/common';

export const setupAppVersioning = (app: NestExpressApplication) => {
  app.enableVersioning({
    type: VersioningType.URI,
  });
};
