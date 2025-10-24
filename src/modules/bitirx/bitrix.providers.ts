import axios from 'axios';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AxiosGlobalInterceptor } from '@/common/interceptors/axios-interceptor';

export const bitrixProviders = [
  {
    provide: 'BitrixApiService',
    useValue: axios.create({}),
  },
];
