import { Inject, Injectable } from '@nestjs/common';
import { B24PORTS } from '@/modules/bitrix/bitrix.constants';
import type { BitrixDepartmentPort } from '@/modules/bitrix/application/ports/departments/departments.port';
import {
  B24DepartmentTypeId,
  DepartmentTypeIds,
} from '@/modules/bitrix/application/interfaces/departments/departments.interface';
import { DepartmentHeadDealCount } from '@/modules/bitrix/application/interfaces/departments/departments-api.interface';
import { REDIS_KEYS } from '@/modules/redis/redis.constants';
import { B24BatchResponseMap } from '@/modules/bitrix/interfaces/bitrix-api.interface';
import { B24User } from '@/modules/bitrix/modules/user/interfaces/user.interface';
import {
  B24BatchCommand,
  B24BatchCommands,
} from '@/modules/bitrix/interfaces/bitrix.interface';
import { B24Deal } from '@/modules/bitrix/application/interfaces/deals/deals.interface';
import dayjs from 'dayjs';
import { RedisService } from '@/modules/redis/redis.service';

@Injectable()
export class BitrixDepartmentsUseCase {
  private readonly departmentTypeIds: DepartmentTypeIds;

  constructor(
    @Inject(B24PORTS.DEPARTMENTS.DEPARTMENT_DEFAULT)
    private readonly bitrixDepartments: BitrixDepartmentPort,
    private readonly redisService: RedisService,
  ) {
    this.departmentTypeIds = {
      advert: [36, 54, 124, 128],
      seo: [90, 92],
      site: [98],
    };
  }

  DEPARTMENT_TYPE_IDS(departmentKey: B24DepartmentTypeId) {
    return departmentKey in this.departmentTypeIds
      ? this.departmentTypeIds[departmentKey]
      : null;
  }

  async getDepartmentList() {
    return this.bitrixDepartments.getDepartmentList();
  }

  async getDepartmentById(ids: string[]) {
    return this.bitrixDepartments.getDepartmentById(ids);
  }

  async getDepartmentByUserId(userId: string) {
    return this.bitrixDepartments.getDepartmentByUserId(userId);
  }

  /**
   * Function receive departments id array
   * calculate count deals at last month on each receive department and
   * return object where key is department head id
   * value is count user deals in department
   *
   * ---
   *
   * Функция принимает пассив идентификаторов подрзделений
   * считает кол-во сделок за текущий месяц
   * и возврщает объект формата:
   *    ключ - id руководителя
   *    значение - кол-во сделок у подчиненных этого руководителя
   *
   * @param ids - array of string where each item is department id
   * @return Promise<object>
   */
  async getHeadCountDealAtLastMonthRate(
    ids: string[],
  ): Promise<DepartmentHeadDealCount> {
    const departmentHeads = await this.getDepartmentById(ids);

    if (departmentHeads.length === 0) return {};

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
        await this.bitrixDepartments.callBatch<Record<string, B24User[]>>(
          departmentHeads.reduce<B24BatchCommands>((acc, { ID, UF_HEAD }) => {
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

    // Проходим по объекту, собираем и выполняем запрос на получение кол-ва сделок за месяц
    const batchResponseGetTotalUserDeals = (
      await this.bitrixDepartments.callBatch<
        B24BatchResponseMap<Record<string, B24Deal[]>>
      >(
        Object.entries(usersByHeadAdvert).reduce<
          Record<string, B24BatchCommand>
        >((acc, [headId, userIds]) => {
          acc[`get_deals-${headId}`] = {
            method: 'crm.deal.list',
            params: {
              filter: {
                '>=UF_CRM_1741670426': `${dayjs(Date.now()).format('YYYY-MM')}`, // Дата перехода в Ожидает звонка клинету (РК настройка)
                '@UF_CRM_1638351463': userIds, // Кто ведет: Любой из сотрудников отдела
              },
            },
          };

          return acc;
        }, {}),
      )
    ).result.result_total;

    // Возвращаем объект
    // где ключ - id руководителя, значение - кол-во сделок подчиненных
    return Object.entries(batchResponseGetTotalUserDeals).reduce<
      Record<string, number>
    >((acc, [command, total]) => {
      const [_, headId] = command.split('-');
      acc[headId] = total;
      return acc;
    }, {});
  }
}
