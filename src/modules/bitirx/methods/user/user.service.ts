import { Injectable } from '@nestjs/common';
import { BitrixService } from '../../bitrix.service';
import { B24User, B24UserListParams } from './user.interface';

@Injectable()
export class BitrixUserService {
  constructor(private readonly bitrixService: BitrixService) {}

  async getUserById(userId: string) {
    return await this.bitrixService.call<B24User>('user.get', {
      filter: {
        ID: userId,
      },
    });
  }

  async getUsers(params: B24UserListParams) {
    return await this.bitrixService.call<B24User[]>('user.get', { ...params });
  }

  async getUsersByDepartment(
    departmentId: number,
    orders: string[][] = [],
    sort: string[] = [],
  ) {
    return await this.bitrixService.call('department.get', {
      id: departmentId,
      orders: orders,
      sort: sort,
    });
  }
}
