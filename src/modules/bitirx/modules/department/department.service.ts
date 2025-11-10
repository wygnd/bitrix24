import { Injectable } from '@nestjs/common';
import {
  B24Department,
  B24DepartmentTypeId,
  DepartmentTypeIds,
} from '@/modules/bitirx/modules/department/department.interface';
import { BitrixService } from '@/modules/bitirx/bitrix.service';
import {
  B24BatchCommands,
  B24ListParams,
} from '@/modules/bitirx/interfaces/bitrix.interface';
import { REDIS_KEYS } from '@/modules/redis/redis.constants';
import { RedisService } from '@/modules/redis/redis.service';
import { NotFoundError } from 'rxjs';
import { B24BatchResponseMap } from '@/modules/bitirx/interfaces/bitrix-api.interface';
import { B24User } from '@/modules/bitirx/modules/user/user.interface';
import { B24Deal } from '@/modules/bitirx/modules/deal/interfaces/deal.interface';

@Injectable()
export class BitrixDepartmentService {
  private readonly departmentTypeIds: DepartmentTypeIds;

  constructor(
    private readonly bitrixService: BitrixService,
    private readonly redisService: RedisService,
  ) {
    this.departmentTypeIds = {
      advert: [36, 54, 124, 128],
      seo: [90, 92],
      site: [98],
    };
  }

  async DEPARTMENTS_TYPE_IDS() {
    return this.departmentTypeIds;
  }

  DEPARTMENT_TYPE_IDS(departmentKey: B24DepartmentTypeId) {
    return departmentKey in this.departmentTypeIds
      ? this.departmentTypeIds[departmentKey]
      : null;
  }

  async getDepartmentList(fields: B24ListParams<B24Department> = {}) {
    const departmentListFromCache = await this.redisService.get<
      B24Department[]
    >(REDIS_KEYS.BITRIX_DATA_DEPARTMENT_LIST);

    if (departmentListFromCache) return departmentListFromCache;

    const { result: departments } = await this.bitrixService.callMethod<
      B24ListParams<B24Department>,
      B24Department[]
    >('department.get');

    if (!departments) throw new NotFoundError('Departments not found');

    this.redisService.set<B24Department[]>(
      REDIS_KEYS.BITRIX_DATA_DEPARTMENT_LIST,
      departments,
      1209600, // 14 дней
    );

    return departments;
  }

  async getDepartmentById(...ids: string[]) {
    let departments = await this.redisService.get<B24Department[]>(
      REDIS_KEYS.BITRIX_DATA_DEPARTMENT_LIST,
    );

    if (!departments) departments = await this.getDepartmentList();

    return departments.filter((d) => ids.includes(d.ID));
  }

  // todo: Add function for new wiki request [get advert setting rate]
  async getAdvertSettingRate() {
    const advertDepartments = await this.getDepartmentById(
      '36',
      '54',
      '124',
      '128',
    );

    if (advertDepartments.length === 0) return false;

    // Пытаемся получить объект руководителей с кол-вом сделок из кеша
    // todo

    // Поулчаем объект с пользователями
    // Где ключ - id руководителя
    // значение - список подчиненных
    let usersByHeadAdvert =
      (await this.redisService.get<Record<string, string[]>>(
        REDIS_KEYS.BITRIX_DATA_DEPARTMENT_HEAD_USERS,
      )) ?? {};

    // Если нет в кеше или объект пустой, делаем заного запрос
    if (!usersByHeadAdvert || Object.keys(usersByHeadAdvert).length === 0) {
      const { result: batchResponseGetUsersByDepartmentId } =
        await this.bitrixService.callBatch<
          B24BatchResponseMap<Record<string, B24User[]>>
        >(
          advertDepartments.reduce<B24BatchCommands>((acc, { ID, UF_HEAD }) => {
            acc[`get_user-${UF_HEAD}-${ID}`] = {
              method: 'user.get',
              params: {
                filter: {
                  UF_DEPARTMENT: ID,
                  ACTIVE: true,
                },
              },
            };
            return acc;
          }, {}),
        );

      usersByHeadAdvert = Object.entries(
        batchResponseGetUsersByDepartmentId.result,
      ).reduce<Record<string, string[]>>((acc, [command, users]) => {
        const [_, headUserId, __] = command.split('-');

        if (!(headUserId in acc)) acc[headUserId] = [];

        users.forEach((user) =>
          headUserId !== user.ID ? acc[headUserId].push(user.ID) : null,
        );

        return acc;
      }, {});

      this.redisService.set<Record<string, string[]>>(
        REDIS_KEYS.BITRIX_DATA_DEPARTMENT_HEAD_USERS,
        usersByHeadAdvert,
        14400, // 4 часа
      );
    }

    // Проходим по обхекту и собираем запрос на получение сделок
    // const batchResponseGetHeadUsersDeals = await this.bitrixService.callBatch<
    //   B24BatchResponseMap<Record<string, B24Deal[]>>
    // >(
    //   Object.entries(usersByHeadAdvert).reduce<
    //     Record<string, B24ListParams<B24Deal>>
    //   >((acc, [headId, userIds]) => {
    //     acc[`get_deals-${headId}`] = {
    //       method: '',
    //       params: {
    //         filter: {
    //           '>UF_CRM_1741670426': '',
    //           '@': userIds,
    //         },
    //       },
    //     };
    //
    //     return acc;
    //   }, {}),
    // );
    // return
  }
}
