import { Injectable } from '@nestjs/common';
import { BitrixService } from '../../bitrix.service';

@Injectable()
export class BitrixUserService {
  constructor(private readonly bitrixService: BitrixService) {}

  async getUserById(userId: string) {
    return await this.bitrixService.call('user.get', {
      filter: {
        ID: userId,
      },
    });
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
