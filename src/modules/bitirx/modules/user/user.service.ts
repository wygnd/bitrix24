import { Injectable } from '@nestjs/common';
import { BitrixService } from '../../bitrix.service';
import { B24User, B24UserListParams } from './user.interface';
import { B24ListParams } from '../../interfaces/bitrix.interface';

@Injectable()
export class BitrixUserService {
  constructor(private readonly bitrixService: BitrixService) {}

  async getUserById(userId: string) {
    return await this.bitrixService.callMethod<
      B24ListParams<Partial<B24User>>,
      B24User
    >('user.get', {
      filter: {
        ID: userId,
      },
    });
  }

  async getUsers(params: B24UserListParams) {
    return await this.bitrixService.callMethod<
      B24UserListParams,
      B24User[]
    >('user.get', { ...params });
  }

  async getUsersByDepartment(
    departmentId: number,
    orders: string[][] = [],
    sort: string[] = [],
  ) {
    return await this.bitrixService.callMethod('department.get', {
      id: departmentId,
      orders: orders,
      sort: sort,
    });
  }
}
