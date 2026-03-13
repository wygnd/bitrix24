import { INestMicroservice, ValidationPipe } from '@nestjs/common';

export const setupAppPipes = (app: INestMicroservice) => {
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
};
