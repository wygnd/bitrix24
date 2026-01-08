import { Injectable, NotFoundException } from '@nestjs/common';
import { BitrixDepartmentPort } from '@/modules/bitrix/application/ports/departments.port';
import { BitrixService } from '@/modules/bitrix/bitrix.service';
import { RedisService } from '@/modules/redis/redis.service';
import { WinstonLogger } from '@/config/winston.logger';
import { B24ListParams } from '@/modules/bitrix/interfaces/bitrix.interface';
import { B24Department } from '@/modules/bitrix/application/interfaces/departments/departments.interface';
import { REDIS_KEYS } from '@/modules/redis/redis.constants';
import { BitrixAbstractAdapter } from '@/modules/bitrix/infrastructure/abstract.adapter';

@Injectable()
export class BitrixDepartmentAdapter
  extends BitrixAbstractAdapter
  implements BitrixDepartmentPort
{
  private readonly logger = new WinstonLogger(
    BitrixDepartmentAdapter.name,
    'bitrix:department'.split(':'),
  );

  constructor(
    private readonly bitrixService: BitrixService,
    private readonly redisService: RedisService,
  ) {
    super(bitrixService);
  }

  /**
   * Get department list
   *
   * ---
   *
   * Получить список подразделений
   */
  async getDepartmentList() {
    try {
      const departmentListFromCache = await this.redisService.get<
        B24Department[]
      >(REDIS_KEYS.BITRIX_DATA_DEPARTMENT_LIST);

      if (departmentListFromCache) return departmentListFromCache;

      const { result: departments } = await this.bitrixService.callMethod<
        B24ListParams<B24Department>,
        B24Department[]
      >('department.get');

      if (!departments) throw new NotFoundException('Departments not found');

      this.redisService.set<B24Department[]>(
        REDIS_KEYS.BITRIX_DATA_DEPARTMENT_LIST,
        departments,
        1209600, // 14 дней
      );

      return departments;
    } catch (error) {
      this.logger.error(error);
      return [];
    }
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
}
