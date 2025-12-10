import { Injectable, NotFoundException } from '@nestjs/common';
import {
  B24Department,
  B24DepartmentTypeId,
  DepartmentTypeIds,
} from '@/modules/bitrix/modules/department/department.interface';
import { BitrixService } from '@/modules/bitrix/bitrix.service';
import {
  B24BatchCommand,
  B24BatchCommands,
  B24ListParams,
} from '@/modules/bitrix/interfaces/bitrix.interface';
import { REDIS_KEYS } from '@/modules/redis/redis.constants';
import { RedisService } from '@/modules/redis/redis.service';
import { NotFoundError } from 'rxjs';
import { B24BatchResponseMap } from '@/modules/bitrix/interfaces/bitrix-api.interface';
import { B24User } from '@/modules/bitrix/modules/user/user.interface';
import { B24Deal } from '@/modules/bitrix/modules/deal/interfaces/deal.interface';
import dayjs from 'dayjs';
import { DepartmentHeadDealCount } from '@/modules/bitrix/modules/department/interfaces/department-api.interface';

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

  // todo: doc
  // todo: list params
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

  /**
   * Function receive array of id departments
   * and return array of department object.
   *
   * For more information: {@link https://apidocs.bitrix24.ru/api-reference/departments/department-get.html#obrabotka-otveta}
   *
   * ---
   *
   * Функция принимает массив идентификаторов подразделений
   * и возвращает массив объектов подразделений.
   *
   * Подробнее: {@link https://apidocs.bitrix24.ru/api-reference/departments/department-get.html#obrabotka-otveta}
   *
   * @param ids
   * @return Promise array of department
   */
  async getDepartmentById(ids: string[]) {
    let departments = await this.redisService.get<B24Department[]>(
      REDIS_KEYS.BITRIX_DATA_DEPARTMENT_LIST,
    );

    if (!departments) departments = await this.getDepartmentList();

    return departments.filter((d) => ids.includes(d.ID));
  }

  async getDepartmentByUserId(userId: string) {
    const departments = await this.getDepartmentList();

    const departmentsFiltered = departments.filter((d) => d.UF_HEAD === userId);

    if (departmentsFiltered.length === 0)
      throw new NotFoundException('Department not found');

    return departmentsFiltered;
  }

  /**
   * Function receive departments id array
   * calculate count deal at last month on each receive department and
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
        await this.bitrixService.callBatch<
          B24BatchResponseMap<Record<string, B24User[]>>
        >(
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
      await this.bitrixService.callBatch<
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
