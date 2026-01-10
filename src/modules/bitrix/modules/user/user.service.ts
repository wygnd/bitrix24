import { Injectable } from '@nestjs/common';
import { BitrixApiService } from '../../bitrix-api.service';
import { B24User, B24UserListParams } from './interfaces/user.interface';
import {
  B24BatchCommands,
  B24ListParams,
} from '../../interfaces/bitrix.interface';
import { B24BatchResponseMap } from '@/modules/bitrix/interfaces/bitrix-api.interface';
import { B24Lead } from '@/modules/bitrix/modules/lead/interfaces/lead.interface';
import { WinstonLogger } from '@/config/winston.logger';

@Injectable()
export class BitrixUserService {
  private readonly logger = new WinstonLogger(
    BitrixUserService.name,
    'bitrix:services'.split(':'),
  );

  constructor(private readonly bitrixService: BitrixApiService) {}

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

  async getUsers(params: B24UserListParams) {
    return await this.bitrixService.callMethod<B24UserListParams, B24User[]>(
      'user.get',
      { ...params },
    );
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
  public async getMinWorkflowUser(users: string[] = []) {
    const minWorkflowUsers = await this.getMinWorkflowUsersSorted(users);

    return minWorkflowUsers.length === 0 ? null : minWorkflowUsers[0].user_id;
  }

  public async getMinWorkflowUsersSorted(users: string[] = []) {
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
      await this.bitrixService.callBatch<
        B24BatchResponseMap<Record<string, B24Lead[]>>
      >(commands);

    return Object.entries(batchResponse.result_total)
      .reduce(
        (acc, [command, totalLeads]) => {
          const [_, userId] = command.split('-');
          acc.push({
            user_id: userId,
            count_leads: totalLeads,
          });
          return acc;
        },
        [] as {
          user_id: string;
          count_leads: number;
        }[],
      )
      .sort(
        (
          { count_leads: firstCountLeads },
          { count_leads: secondCountLeads },
        ) => {
          return firstCountLeads > secondCountLeads
            ? 1
            : secondCountLeads > firstCountLeads
              ? -1
              : 0;
        },
      );
  }
}
