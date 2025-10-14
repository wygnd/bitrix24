import { Inject, Injectable } from '@nestjs/common';
import { AuthModel } from './auth.entity';

@Injectable()
export class AuthService {
  constructor(
    @Inject('AuthRepository')
    private readonly authRepository: typeof AuthModel,
  ) {}

  async getAuth() {}
}
