import { Injectable } from '@nestjs/common';
import {
  B24DepartmentTypeId,
  DepartmentHeadUserId,
  DepartmentTypeIds,
} from '@/modules/bitirx/modules/department/department.interface';

@Injectable()
export class BitrixDepartmentService {
  private readonly departmentTypeIds: DepartmentTypeIds;
  private readonly departmentHeadUserIds: DepartmentHeadUserId[];

  constructor() {
    this.departmentTypeIds = {
      advert: [36, 54, 124, 128],
      seo: [90, 92],
      site: [98],
    };

    this.departmentHeadUserIds = [
      { userId: 216, departmentId: 36 },
      { userId: 316, departmentId: 54 },
      { userId: 444, departmentId: 124 },
      { userId: 560, departmentId: 128 },
    ];
  }

  get DEPARTMENTS_TYPE_IDS() {
    return this.departmentTypeIds;
  }

  DEPARTMENT_TYPE_IDS(departmentKey: B24DepartmentTypeId) {
    return departmentKey in this.departmentTypeIds
      ? this.departmentTypeIds[departmentKey]
      : null;
  }

  get DEPARTMENT_HEAD_USER_IDS() {
    return this.departmentHeadUserIds;
  }

  // todo: Add function for new wiki request [get advert setting rate]
  async getAdvertSettingRate() {}
}
