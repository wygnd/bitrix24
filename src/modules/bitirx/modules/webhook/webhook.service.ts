import { BitrixService } from '@/modules/bitirx/bitrix.service';
import { BitrixImBotService } from '@/modules/bitirx/modules/imbot/imbot.service';
import { BadRequestException, Injectable } from '@nestjs/common';
import { IncomingWebhookDistributeDealDto } from '@/modules/bitirx/modules/webhook/dtos/incoming-webhook-distribute-deal.dto';
import { BitrixDepartmentService } from '@/modules/bitirx/modules/department/department.service';
import { B24DepartmentTypeId } from '@/modules/bitirx/modules/department/department.interface';
import { B24BatchCommands } from '@/modules/bitirx/interfaces/bitrix.interface';
import { RedisService } from '@/modules/redis/redis.service';
import { B24BatchResponseMap } from '@/modules/bitirx/interfaces/bitrix-api.interface';
import { B24User } from '@/modules/bitirx/modules/user/user.interface';
import {
  WebhookUserData,
  WebhookUserItem,
} from '@/modules/bitirx/modules/webhook/interfaces/webhook-user.interface';
import { REDIS_KEYS } from '@/modules/redis/redis.constants';
import type { B24ImKeyboardOptions } from '@/modules/bitirx/modules/im/interfaces/im.interface';
import { B24DistributeDealKeyboardParams } from '@/modules/bitirx/modules/webhook/interfaces/webhook-distribute-deal-keyboard-params.interface';
import { WebhookDepartmentInfo } from '@/modules/bitirx/modules/webhook/interfaces/webhook-department-info.interface';
import { B24Deal } from '@/modules/bitirx/modules/deal/interfaces/deal.interface';

@Injectable()
export class BitrixWebhookService {
  private readonly departmentInfo: Record<
    B24DepartmentTypeId,
    WebhookDepartmentInfo
  >;

  constructor(
    private readonly bitrixService: BitrixService,
    private readonly bitrixBotService: BitrixImBotService,
    private readonly bitrixDepartmentService: BitrixDepartmentService,
    private readonly redisService: RedisService,
  ) {
    this.departmentInfo = {
      [B24DepartmentTypeId.SITE]: {
        stage: '37',
        dealAssignedField: 'UF_CRM_1589349464', // Проект-менеджер
        hideUsers: [
          '56', // Анастасия Загоскина
        ],
      },
      [B24DepartmentTypeId.ADVERT]: {
        stage: 'C1:NEW',
        dealAssignedField: 'UF_CRM_1638351463', // Кто ведет
        hideUsers: [],
      },
      [B24DepartmentTypeId.SEO]: {
        stage: '',
        dealAssignedField: '',
        hideUsers: [
          '402', // Степан Комягин
          '158', // Артем Шевелёв
        ],
      },
    };
  }

  async handleIncomingWebhookToDistributeNewDeal(
    fields: IncomingWebhookDistributeDealDto,
  ) {
    const {
      department,
      dialog_id,
      deal_title,
      deal_id,
      is_repeat = 0,
    } = fields;

    const departmentIds =
      this.bitrixDepartmentService.DEPARTMENT_TYPE_IDS(department);

    if (!departmentIds) throw new BadRequestException('Invalid department key');

    switch (department) {
      case B24DepartmentTypeId.ADVERT:
        break;

      case B24DepartmentTypeId.SITE:
        break;

      case B24DepartmentTypeId.SEO:
        break;
    }

    let userDepartmentsFromCache =
      (await this.redisService.get<
        Record<B24DepartmentTypeId, WebhookUserData>
      >(REDIS_KEYS.BITRIX_DATA_USER_DEPARTMENTS)) ??
      ({} as Record<B24DepartmentTypeId, WebhookUserData>);

    // Если в кеше нет, обращаемся к битриксу
    if (
      !userDepartmentsFromCache ||
      Object.keys(userDepartmentsFromCache).length === 0 ||
      !(department in userDepartmentsFromCache) ||
      Object.keys(userDepartmentsFromCache[department]).length === 0
    ) {
      const batchCommandsGetUsers: B24BatchCommands = {};

      // Собираем батч запрос на получение пользователей по подразделениям
      departmentIds.forEach((departmentId) => {
        batchCommandsGetUsers[`get_users-${department}-${departmentId}`] = {
          method: 'user.get',
          params: {
            FILTER: {
              UF_DEPARTMENT: departmentId,
              ACTIVE: true,
            },
          },
        };
      });

      // Выполняем батч запрос
      const batchResponseGetUsers = await this.bitrixService.callBatch<
        B24BatchResponseMap<Record<string, B24User[]>>
      >(batchCommandsGetUsers);

      // Проходимся по результату и формируем массив пользователей с нужной нам инфой
      userDepartmentsFromCache[department] = Object.entries(
        batchResponseGetUsers.result.result,
      ).reduce<WebhookUserData>((acc, [command, users]) => {
        const [_, __, depId] = command.split('-');

        if (!(depId in acc)) acc[depId] = [];

        users.forEach((user) => {
          const userData: WebhookUserItem = {
            userId: user.ID,
            name: `${user.NAME} ${user.LAST_NAME}`,
          };

          // Специльно для сео. У них 2 раза надо нажимать кнопку, чтобы сделка распределилась
          switch (department) {
            case B24DepartmentTypeId.SEO:
              switch (user.UF_DEPARTMENT[0]) {
                case 90:
                  userData.seoToken = 'tec';
                  break;

                case 92:
                  userData.seoToken = 'pm';
                  break;
              }
              break;
          }

          acc[depId].push(userData);
        });
        return acc;
      }, {});

      // Сохраняем в кеш на 8 часов
      this.redisService.set<Record<B24DepartmentTypeId, WebhookUserData>>(
        REDIS_KEYS.BITRIX_DATA_USER_DEPARTMENTS,
        userDepartmentsFromCache as Record<
          B24DepartmentTypeId,
          WebhookUserData
        >,
        28800,
      );
    }

    //   Собираем клавиатуру
    const messageKeyboard = Object.entries(
      userDepartmentsFromCache[department],
    ).reduce<B24ImKeyboardOptions[]>((acc, [depId, users]) => {
      users.forEach((user) => {
        // Не добавляем руководителей и тех, кто отмечен в скрытых
        if (
          this.departmentInfo[department].hideUsers.find(
            (u) => u === user.userId,
          )
        )
          return;

        const keyboardItemOptions: B24ImKeyboardOptions = {
          TEXT: user.name,
          COMMAND: 'distributeNewDeal',
          BLOCK: 'Y',
          BG_COLOR_TOKEN: 'primary',
          DISPLAY: 'LINE',
        };

        const keyboardItemParams: B24DistributeDealKeyboardParams = {
          handle: `distributeDeal`,
          managerId: user.userId,
          department: department,
          dealId: deal_id,
          chatId: dialog_id,
          assignedFieldId: this.departmentInfo[department].dealAssignedField,
          stage: this.departmentInfo[department].stage,
        };

        switch (department) {
          case B24DepartmentTypeId.SEO:
            keyboardItemOptions.BLOCK = 'N';

            switch (depId) {
              case '90':
                // SEO Технический специалист
                keyboardItemParams.assignedFieldId = 'UF_CRM_1703764564';
                keyboardItemOptions.BG_COLOR_TOKEN = 'secondary';
                break;

              case '92':
                // SEO Проект-менеджер
                keyboardItemParams.assignedFieldId = 'UF_CRM_1623766928';
                keyboardItemParams.stage = null;
                break;
            }

            break;
        }

        keyboardItemOptions.COMMAND_PARAMS = JSON.stringify(keyboardItemParams);
        acc.push(keyboardItemOptions);
      });
      return acc;
    }, []);

    const batchCommandsSendMessage: B24BatchCommands = {};

    let message =
      is_repeat == 0
        ? 'Добавлена новая сделка, необходимо распределить'
        : 'Сделка [b]НЕ РАСПРЕДЕЛЕНА[/b] необходимо распределить';

    message += ` ${this.bitrixService.generateDealUrl(deal_id, deal_title)}`;

    switch (department) {
      case B24DepartmentTypeId.SITE:
        batchCommandsSendMessage['get_deal'] = {
          method: 'crm.deal.get',
          params: {
            id: deal_id,
          },
        };

        message +=
          '[br]Общая сумма: $result[get_deal][UF_CRM_639AB96F4A820]\n' +
          'Аванс 1: $result[get_deal][UF_CRM_61CAEBD653BED]\n' +
          'Аванс 2: $result[get_deal][UF_CRM_61CAEBD661A42]\n' +
          'Аванс 3: $result[get_deal][UF_CRM_61CAEBD66F4A9]';
        break;

      case B24DepartmentTypeId.ADVERT:
        break;

      case B24DepartmentTypeId.SEO:
        message +=
          '[br][b]Первым выбирать технического специалиста, после проект-менеджера[/b]';
        break;
    }

    batchCommandsSendMessage['send_message'] = {
      method: 'imbot.message.add',
      params: {
        BOT_ID: this.bitrixBotService.BOT_ID,
        DIALOG_ID: 'chat77152',
        MESSAGE: message,
        KEYBOARD: messageKeyboard,
      },
    };

    this.bitrixService
      .callBatch<
        B24BatchResponseMap<{
          get_deal: B24Deal;
          send_message: number;
        }>
      >(batchCommandsSendMessage)
      .then((result) => console.log(result.result.result.get_deal));

    return true;
  }

  private async distributeSiteDeal(fields: IncomingWebhookDistributeDealDto) {}

  // todo
  private async distributeNewAdvertDeal(
    fields: IncomingWebhookDistributeDealDto,
  ) {}
}
