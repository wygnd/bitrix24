import { APP_INTERCEPTOR } from '@nestjs/core';
import { BitrixResponseInterceptor } from '../../common/interceptors/bitrix-response.interceptor';

export const httpProviders = [
  {
    provide: APP_INTERCEPTOR,
    useClass: BitrixResponseInterceptor,
  },
];
