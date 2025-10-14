import { AuthModel } from './auth.entity';

export const authProviders = [
  {
    provide: 'AuthRepository',
    useValue: AuthModel,
  },
];
