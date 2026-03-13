import { INestMicroservice, Logger } from '@nestjs/common';

const errorLogger = new Logger('ERROR');

export const setupListenAppErrors = (app: INestMicroservice) => {
  app.on('error', (error) => {
    errorLogger.error(error);
  });
};
