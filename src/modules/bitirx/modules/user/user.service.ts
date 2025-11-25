import { Injectable } from '@nestjs/common';
import { BitrixService } from '../../bitrix.service';
import { B24User, B24UserListParams } from './user.interface';
import {
  B24BatchCommands,
  B24ListParams,
} from '../../interfaces/bitrix.interface';
import { AvitoCreateLeadDto } from '@/modules/bitirx/modules/integration/avito/dtos/avito-create-lead.dto';
import { B24BatchResponseMap } from '@/modules/bitirx/interfaces/bitrix-api.interface';
import { B24Lead } from '@/modules/bitirx/modules/lead/interfaces/lead.interface';

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
    const commands = users.reduce((acc, userId) => {
      acc[`get_user-${userId}`] = {
        method: 'user.get',
        params: {
          filter: {
            ID: userId,
          },
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
      )[0].user_id;
  }
}
