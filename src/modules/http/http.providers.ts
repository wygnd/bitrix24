import { APP_INTERCEPTOR } from '@nestjs/core';

export const httpProviders = [
  {
    provide: APP_INTERCEPTOR,
    // useClass: BitrixResponseInterceptor,
  },
];
