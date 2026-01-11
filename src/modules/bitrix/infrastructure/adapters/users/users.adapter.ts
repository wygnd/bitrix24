import { Inject, Injectable } from '@nestjs/common';
import { BitrixUsersPort } from '@/modules/bitrix/application/ports/users/users.port';
import {
  B24BatchCommands,
  B24ListParams,
} from '@/modules/bitrix/interfaces/bitrix.interface';
import {
  B24MinWorkflowUserOptions,
  B24User,
  B24UserListParams,
} from '@/modules/bitrix/application/interfaces/users/user.interface';
import { WinstonLogger } from '@/config/winston.logger';
import { B24PORTS } from '@/modules/bitrix/bitrix.constants';
import type { BitrixPort } from '@/modules/bitrix/application/ports/common/bitrix.port';
import { B24Lead } from '@/modules/bitrix/application/interfaces/leads/lead.interface';

@Injectable()
export class BitrixUsersAdapter implements BitrixUsersPort {
  private readonly logger = new WinstonLogger(
    BitrixUsersAdapter.name,
    'bitrix:users'.split(':'),
  );

  constructor(
    @Inject(B24PORTS.BITRIX) private readonly bitrixService: BitrixPort,
  ) {}

  /**
   * Get user by user_id
   *
   * ---
   *
   * Получить информацию о пользователе по user_id
   * @param userId
   */
  async getUserById(userId: string) {
    try {
      const { result } = await this.bitrixService.callMethod<
        B24ListParams<Partial<B24User>>,
        B24User
      >('user.get', {
        filter: {
          ID: userId,
        },
      });

      return result ?? null;
    } catch (error) {
      this.logger.error(error, true);
      return null;
    }
  }

  /**
   * Get user list by specific fields
   *
   * ---
   *
   * Получить список пользователей по определенным параметрам
   * @param params
   */
  async getUsers(params: B24UserListParams) {
    try {
      const response = await this.bitrixService.callMethod<
        B24UserListParams,
        B24User[]
      >('user.get', { ...params });

      return response?.result ?? [];
    } catch (error) {
      this.logger.error(error);
      return [];
    }
  }

  /**
   * Function receive array of bitrix user ids get info about new leads on each manager and getting most free workflow user
   *
   * ---
   *
   * Функция принимает массив id пользователей. Получает по каждому информацию о кол-ве новых лидов и возвращает пользователя, у которого меньше новых лидов
   *
   * @param users
   */
  public async getMinWorkflowUser(users: string[]) {
    const minWorkflowUsers = await this.getMinWorkflowUsers(users);

    return minWorkflowUsers.length === 0 ? null : minWorkflowUsers[0].userId;
  }

  public async getMinWorkflowUsers(users: string[] = []) {
    const commands = users.reduce((acc, userId) => {
      acc[`get_user-${userId}`] = {
        method: 'crm.lead.list',
        params: {
          filter: {
            ASSIGNED_BY_ID: userId,
            '>=DATE_CREATE': new Date().toLocaleDateString(),
          },
          select: ['ID'],
          start: 0,
        },
      };

      return acc;
    }, {} as B24BatchCommands);

    const { result: batchResponse } =
      await this.bitrixService.callBatch<Record<string, B24Lead[]>>(commands);

    return Object.entries(batchResponse.result_total)
      .reduce<B24MinWorkflowUserOptions[]>(
        (acc, [command, totalLeads]) => {
          const [_, userId] = command.split('-');
          acc.push({
            userId: userId,
            countLeads: totalLeads,
          });
          return acc;
        },
        [] as {
          userId: string;
          countLeads: number;
        }[],
      )
      .sort(
        ({ countLeads: firstCountLeads }, { countLeads: secondCountLeads }) => {
          return firstCountLeads > secondCountLeads
            ? 1
            : secondCountLeads > firstCountLeads
              ? -1
              : 0;
        },
      );
  }
}
