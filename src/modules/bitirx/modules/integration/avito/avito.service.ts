import { Injectable } from '@nestjs/common';
import { BitrixService } from '@/modules/bitirx/bitrix.service';
import { B24BatchResponseMap } from '@/modules/bitirx/interfaces/bitrix-api.interface';
import { B24User } from '@/modules/bitirx/modules/user/user.interface';
import { B24BatchCommands } from '@/modules/bitirx/interfaces/bitrix.interface';
import { B24Lead } from '@/modules/bitirx/modules/lead/lead.interface';
import { B24Department } from '@/modules/bitirx/modules/department/department.interface';

@Injectable()
export class BitrixIntegrationAvitoService {
  constructor(private readonly bitrixService: BitrixService) {}

  // todo: write function
  public async getMinWorkflowUser(users: number[]) {
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

    const usersLeadsCount = Object.entries(batchResponse.result_total)
      .reduce(
        (acc, [command, totalLeads]) => {
          const [commandName, userId] = command.split('-');
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

    return usersLeadsCount[0].user_id;
  }
}
