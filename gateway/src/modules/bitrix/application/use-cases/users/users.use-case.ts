import { Inject, Injectable } from '@nestjs/common';
import type { BitrixUsersPort } from '@/modules/bitrix/application/ports/users/users.port';
import { B24PORTS } from '@/modules/bitrix/bitrix.constants';
import { B24UserListParams } from '@/modules/bitrix/application/interfaces/users/user.interface';

@Injectable()
export class BitrixUsersUseCase {
  constructor(
    @Inject(B24PORTS.USERS.USERS_DEFAULT)
    private readonly users: BitrixUsersPort,
  ) {}

  async getUserById(userId: string) {
    return this.users.getUserById(userId);
  }

  async getUsers(params: B24UserListParams) {
    return this.users.getUsers(params);
  }
}
