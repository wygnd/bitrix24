import { BitrixService } from '@/modules/bitrix/bitrix.service';
import { BitrixImBotService } from '@/modules/bitrix/modules/imbot/imbot.service';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { IncomingWebhookDistributeDealDto } from '@/modules/bitrix/modules/webhook/dtos/incoming-webhook-distribute-deal.dto';
import { BitrixDepartmentService } from '@/modules/bitrix/modules/department/department.service';
import {
  B24Department,
  B24DepartmentTypeId,
} from '@/modules/bitrix/modules/department/department.interface';
import { B24BatchCommands } from '@/modules/bitrix/interfaces/bitrix.interface';
import { RedisService } from '@/modules/redis/redis.service';
import { B24BatchResponseMap } from '@/modules/bitrix/interfaces/bitrix-api.interface';
import { B24User } from '@/modules/bitrix/modules/user/interfaces/user.interface';
import {
  WebhookUserData,
  WebhookUserItem,
} from '@/modules/bitrix/modules/webhook/interfaces/webhook-user.interface';
import { REDIS_KEYS } from '@/modules/redis/redis.constants';
import type { B24ImKeyboardOptions } from '@/modules/bitrix/modules/im/interfaces/im.interface';
import { WebhookDepartmentInfo } from '@/modules/bitrix/modules/webhook/interfaces/webhook-department-info.interface';
import { WikiService } from '@/modules/wiki/wiki.service';
import { DistributeAdvertDealWikiResponse } from '@/modules/wiki/interfaces/wiki-distribute-deal.interface';
import {
  ImbotHandleApproveSiteForAdvert,
  ImbotHandleDistributeNewDeal,
} from '@/modules/bitrix/modules/imbot/interfaces/imbot-handle.interface';
import { IncomingWebhookApproveSiteForDealDto } from '@/modules/bitrix/modules/webhook/dtos/incoming-webhook-approve-site-for-deal.dto';
import { B24Task } from '@/modules/bitrix/modules/task/interfaces/task.interface';
import { B24Deal } from '@/modules/bitrix/modules/deal/interfaces/deal.interface';
import dayjs from 'dayjs';
import { B24Emoji } from '@/modules/bitrix/bitrix.constants';
import { IncomingWebhookApproveSiteForCase } from '@/modules/bitrix/modules/webhook/dtos/incoming-webhook-approve-site-for-case.dto';
import { ImbotKeyboardApproveSiteForCase } from '@/modules/bitrix/modules/imbot/interfaces/imbot-keyboard-approve-site-for-case.interface';
import { isAxiosError } from 'axios';
import {
  B24LeadActiveStages,
  B24LeadConvertedStages,
  B24LeadNewStages,
  B24LeadRejectStages,
} from '@/modules/bitrix/modules/lead/constants/lead.constants';
import { BitrixLeadService } from '@/modules/bitrix/modules/lead/services/lead.service';
import { WinstonLogger } from '@/config/winston.logger';
import { B24EventVoxImplantCallInitDto } from '@/modules/bitrix/modules/events/dtos/event-voximplant-call-init.dto';
import { TelphinService } from '@/modules/telphin/telphin.service';
import {
  B24WebhookHandleCallInitForSaleManagersOptions,
  B24WebhookHandleCallStartForSaleManagersOptions,
  B24WebhookVoxImplantCallInitOptions,
  B24WebhookVoxImplantCallInitTaskOptions,
  B24WebhookVoxImplantCallStartOptions,
} from '@/modules/bitrix/modules/webhook/interfaces/webhook-voximplant-calls.interface';
import { TelphinExtensionItemExtraParams } from '@/modules/telphin/interfaces/telphin-extension.interface';
import { B24EventVoxImplantCallStartDto } from '@/modules/bitrix/modules/events/dtos/event-voximplant-call-start.dto';
import { QueueLightService } from '@/modules/queue/queue-light.service';
import { B24CallType } from '@/modules/bitrix/interfaces/bitrix-call.interface';

@Injectable()
export class BitrixWebhookService {
  private readonly departmentInfo: Record<
    B24DepartmentTypeId,
    WebhookDepartmentInfo
  >;
  private lastSelectedDepartmentId: string = '';
  private readonly logger = new WinstonLogger(
    BitrixWebhookService.name,
    'bitrix:services:webhook'.split(':'),
  );

  constructor(
    private readonly bitrixService: BitrixService,
    private readonly bitrixBotService: BitrixImBotService,
    private readonly bitrixDepartmentService: BitrixDepartmentService,
    private readonly redisService: RedisService,
    private readonly wikiService: WikiService,
    private readonly bitrixLeadService: BitrixLeadService,
    private readonly telphinService: TelphinService,
    private readonly queueLightService: QueueLightService,
  ) {
    this.departmentInfo = {
      [B24DepartmentTypeId.SITE]: {
        stage: '37',
        dealAssignedField: 'UF_CRM_1589349464', // Проект-менеджер
        hideUsers: [
          '56', // Анастасия Загоскина
        ],
        addUsers: [
          {
            userId: '274',
            name: 'Данил Куршев',
          },
        ],
        chatId: 'chat36368',
        nextChatId: 'chat766',
        distributedStageId: {
          '0': 'UC_ERQDZN',
        },
      },
      [B24DepartmentTypeId.ADVERT]: {
        stage: 'C1:NEW',
        dealAssignedField: 'UF_CRM_1638351463', // Кто ведет
        hideUsers: [],
        chatId: 'chat12862',
        nextChatId: 'chat2640',
        distributedStageId: {
          '1': 'C1:UC_05626B',
        },
      },
      [B24DepartmentTypeId.SEO]: {
        stage: '',
        dealAssignedField: '',
        hideUsers: [
          '402', // Степан Комягин
          '158', // Артем Шевелёв
        ],
        chatId: 'chat36370',
        nextChatId: 'chat6368',
        category: {
          '34': 'C34:PREPAYMENT_INVOIC',
          '16': 'C16:NEW',
          '7': 'C7:NEW',
        },
        distributedStageId: {
          '34': 'C34:PREPARATION',
          '16': 'C16:UC_NR6UPR',
          '7': 'C7:UC_6MBZS4',
        },
      },
    };
  }

  /**
   * Function handle incoming webhook from bitrix
   * Get all employers department and form message for distribute deal
   *
   * ---
   *
   * Функция обрабатывает исходящий вебхук из битрикс24.
   * Получает всех сотрудников подразделения и формирует сообщение для распределения сделки
   *
   * @param fields
   */
  async handleIncomingWebhookToDistributeNewDeal(
    fields: IncomingWebhookDistributeDealDto,
  ) {
    const { department, deal_title, deal_id, is_repeat = 0, category } = fields;

    const departmentIds =
      this.bitrixDepartmentService.DEPARTMENT_TYPE_IDS(department);

    if (!departmentIds) throw new BadRequestException('Invalid department key');

    // Получаем подразделения
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

    let nextAdvertHead: DistributeAdvertDealWikiResponse | null = null;
    let nextAdvertInfo: WebhookUserItem | null = null;

    switch (department) {
      case B24DepartmentTypeId.ADVERT:
        try {
          /**
           *  Отправляем запрос на new wiki, для получения следующего руководителя
           *
           *  Это сделано, для того, чтобы не выводить в сообщении сотрудников всех 4-х отделов(на момент разработки) рекламы
           *  Функция getHeadCountDealAtLastMonthRate в результате отдает объект,
           *  где ключ - id руководителя, значение - кол-во сделок подчиненных за текущий/последний месяц
           */
          nextAdvertHead = await this.wikiService.getAdvertNextHead(
            await this.bitrixDepartmentService.getHeadCountDealAtLastMonthRate([
              '36',
              '54',
              '124',
              '128',
            ]),
          );
          const [departmentFiltered] =
            await this.bitrixDepartmentService.getDepartmentByUserId(
              nextAdvertHead.bitrix_id,
            );

          // Проходимся по всем подразделениям и убираем лишние
          // Лишние - все, кроме того, который упал в результате пердыдущего запроса
          Object.keys(userDepartmentsFromCache[department]).forEach(
            (departmentId) => {
              if (departmentId !== departmentFiltered.ID) {
                delete userDepartmentsFromCache[department][departmentId];
                return;
              }

              userDepartmentsFromCache[department][departmentId] = (
                userDepartmentsFromCache[department][
                  departmentId
                ] as WebhookUserItem[]
              ).filter((user) => {
                if (user.userId === nextAdvertHead?.bitrix_id) {
                  nextAdvertInfo = user;
                  return false;
                }

                return true;
              });
            },
          );
        } catch (e) {
          console.log(
            'ERROR ON SEND REQUEST TO NEW WIKI',
            isAxiosError(e) ? e.response : e,
          );
          // Если возникла ошибка оставляем всех подчиненных
          this.bitrixBotService.sendMessage({
            DIALOG_ID: this.bitrixService.TEST_CHAT_ID,
            MESSAGE:
              '[b](Ошибка: Распределение сделок -> РК)[/b][br][br]Произошла ошибка при попытке запроса new-wiki[br]' +
              `Ошибка: ${JSON.stringify(e)}`,
          });
        }
        break;

      case B24DepartmentTypeId.SITE:
        break;

      case B24DepartmentTypeId.SEO:
        break;
    }

    // Объект батч запросов
    const batchCommandsSendMessage: B24BatchCommands = {};
    // Собираем сообщение
    let message =
      is_repeat == 0
        ? 'Добавлена новая сделка, необходимо распределить'
        : `${B24Emoji.REFUSAL} Сделка [b]НЕ РАСПРЕДЕЛЕНА[/b] необходимо распределить`;

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
          '[br][br]Общая сумма: $result[get_deal][UF_CRM_639AB96F4A820]\n' +
          'Аванс 1: $result[get_deal][UF_CRM_61CAEBD653BED]\n' +
          'Аванс 2: $result[get_deal][UF_CRM_61CAEBD661A42]\n' +
          'Аванс 3: $result[get_deal][UF_CRM_61CAEBD66F4A9]';
        break;

      case B24DepartmentTypeId.ADVERT:
        break;

      case B24DepartmentTypeId.SEO:
        message +=
          '[br][br][b]Первым выбирать технического специалиста, после проект-менеджера[/b]';
        break;
    }

    /**
     * Собираем клавиатуру
     * подробнее: https://apidocs.bitrix24.ru/api-reference/chats/messages/keyboards.html
     */
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

        // Собираем кнопку
        const keyboardItemOptions: B24ImKeyboardOptions = {
          TEXT: user.name,
          COMMAND: 'distributeNewDeal',
          BLOCK: 'Y',
          BG_COLOR_TOKEN: 'primary',
          DISPLAY: 'LINE',
        };

        // COMMAND_PARAMS у кнопки
        const keyboardItemParams: ImbotHandleDistributeNewDeal = {
          handle: `distributeDeal`,
          managerId: user.userId,
          managerName: user.name,
          department: department,
          dealTitle: deal_title,
          dealId: deal_id,
          chatId: this.departmentInfo[department].nextChatId,
          assignedFieldId: this.departmentInfo[department].dealAssignedField,
          stage: this.departmentInfo[department].stage,
        };

        switch (department) {
          case B24DepartmentTypeId.SEO:
            if (
              !this.departmentInfo[department].category ||
              !(category in this.departmentInfo[department].category)
            )
              break;

            keyboardItemOptions.BLOCK = 'N';

            switch (depId) {
              case '90':
                // SEO Проект-менеджер
                keyboardItemParams.assignedFieldId = 'UF_CRM_1703764564';
                keyboardItemOptions.BG_COLOR_TOKEN = 'secondary';
                keyboardItemParams.stage =
                  this.departmentInfo[department].category[category];
                break;

              case '92':
                // SEO Технический специалист
                keyboardItemParams.assignedFieldId = 'UF_CRM_1623766928';
                keyboardItemParams.stage = '';
                break;
            }

            break;
        }

        keyboardItemOptions.COMMAND_PARAMS = JSON.stringify(keyboardItemParams);
        acc.push(keyboardItemOptions);
      });
      return acc;
    }, []);

    switch (department) {
      case B24DepartmentTypeId.ADVERT:
        if (!nextAdvertHead) break;

        if (nextAdvertInfo) {
          const { userId, name } = nextAdvertInfo as WebhookUserItem;

          message =
            `[user=${userId}]${name}[/user][br]${message}\n\n` +
            '$result[get_deal][UF_CRM_1600184739]' + // Ссылка на сайт боевая
            '\n' +
            '$result[get_deal][UF_CRM_1716383143]'; // Комментарий к сделке;
        }

        batchCommandsSendMessage['get_deal'] = {
          method: 'crm.deal.get',
          params: {
            id: deal_id,
          },
        };
        break;
    }

    // Кастомные кнопки с пользователями
    if (
      this.departmentInfo[department].addUsers &&
      this.departmentInfo[department].addUsers.length > 0
    ) {
      this.departmentInfo[department].addUsers.forEach((user) => {
        // Собираем кнопку
        const hardcodeKeyboardItemOptions: B24ImKeyboardOptions = {
          TEXT: user.name,
          COMMAND: 'distributeNewDeal',
          BLOCK: 'Y',
          BG_COLOR_TOKEN: 'primary',
          DISPLAY: 'LINE',
        };

        const hardcodeKeyboardItemParams: ImbotHandleDistributeNewDeal = {
          handle: `distributeDeal`,
          managerId: user.userId,
          managerName: user.name,
          department: department,
          dealTitle: deal_title,
          dealId: deal_id,
          chatId: this.departmentInfo[department].nextChatId,
          assignedFieldId: this.departmentInfo[department].dealAssignedField,
          stage: this.departmentInfo[department].stage,
        };

        hardcodeKeyboardItemOptions.COMMAND_PARAMS = JSON.stringify(
          hardcodeKeyboardItemParams,
        );
        messageKeyboard.push(hardcodeKeyboardItemOptions);
      });
    }

    batchCommandsSendMessage['send_message'] = {
      method: 'imbot.message.add',
      params: {
        BOT_ID: this.bitrixBotService.BOT_ID,
        DIALOG_ID: this.departmentInfo[department].chatId,
        MESSAGE: message,
        KEYBOARD: messageKeyboard,
      },
    };

    // Отправляем запрос
    this.bitrixService.callBatch(batchCommandsSendMessage);
    return true;
  }

  async handleIncomingWebhookToApproveSiteForAdvert(
    { project_manager_id, chat_id }: IncomingWebhookApproveSiteForDealDto,
    dealId: string,
  ) {
    const advertDepartments =
      await this.bitrixDepartmentService.getDepartmentById([
        '36',
        '54',
        '124',
        '128',
      ]);
    let advertDepartment =
      this.bitrixService.getRandomElement<B24Department>(advertDepartments);

    if (this.lastSelectedDepartmentId === advertDepartment.ID) {
      advertDepartment =
        this.bitrixService.getRandomElement<B24Department>(advertDepartments);
    }

    this.lastSelectedDepartmentId = advertDepartment.ID;

    const keyboardItemParams: ImbotHandleApproveSiteForAdvert = {
      dealId: dealId,
      isApprove: true,
      managerId: project_manager_id,
    };

    const keyboard: B24ImKeyboardOptions[] = [
      {
        TEXT: 'Согласованно',
        COMMAND: 'approveSiteDealForAdvert',
        COMMAND_PARAMS: JSON.stringify(keyboardItemParams),
        BG_COLOR_TOKEN: 'primary',
        DISPLAY: 'LINE',
        BLOCK: 'Y',
      },
      {
        TEXT: 'Не согласованно',
        COMMAND: 'approveSiteDealForAdvert',
        COMMAND_PARAMS: JSON.stringify({
          ...keyboardItemParams,
          isApprove: false,
        }),
        BG_COLOR_TOKEN: 'alert',
        DISPLAY: 'LINE',
        BLOCK: 'Y',
      },
    ];

    const { result: batchResponseCreateTask } =
      await this.bitrixService.callBatch<
        B24BatchResponseMap<{
          get_deal: B24Deal;
          create_task: { task: B24Task };
        }>
      >({
        get_deal: {
          method: 'crm.deal.get',
          params: {
            id: dealId,
          },
        },
        get_lead: {
          method: 'crm.deal.list',
          params: {
            FILTER: {
              UF_CRM_1731418991: '$result[get_deal][UF_CRM_1731418991]',
              CATEGORY_ID: '1',
            },
            SELECT: ['ID'],
          },
        },
        get_advert_deal: {
          method: 'crm.deal.list',
          params: {
            FILTER: {
              ID: '$result[get_lead][0][ID]',
            },
            SELECT: ['ID', 'UF_CRM_1716383143'],
          },
        },
        create_task: {
          method: 'tasks.task.add',
          params: {
            fields: {
              TITLE:
                'Необходимо проверить сайт на дееспособность работы на РК.',
              DEADLINE: dayjs().format('YYYY-MM-DD') + 'T18:00:00',
              DESCRIPTION:
                '$result[get_deal][UF_CRM_1600184739]\n' +
                '$result[get_deal][UF_CRM_1600184739]\n\n' +
                'Если нет замечаний, то завершай задачу и в сообщении нажми на кнопку [b]Согласованно[/b]\n\n' +
                'Если есть правки, то:\n- НЕ завершай задачу\n' +
                '- Пропиши в комментариях задачи список правок\n' +
                '- Нажми в сообщении кнопку [b]Не согласованно[/b]\n\n' +
                'Комментарий сделки РК:\n$result[get_advert_deal][0][UF_CRM_1716383143]',
              CREATED_BY: '460',
              RESPONSIBLE_ID: advertDepartment.UF_HEAD,
              UF_CRM_TASK: [`D_${dealId}`],
              ACCOMPLICES: advertDepartments
                .filter((d) => d.ID !== advertDepartment.ID)
                .map((d) => d.UF_HEAD),
              AUDITORS: [project_manager_id],
            },
          },
        },
      });

    if (Object.keys(batchResponseCreateTask.result_error).length !== 0)
      throw new BadRequestException(batchResponseCreateTask.result_error);

    const { id: taskId } = batchResponseCreateTask.result.create_task.task;

    this.bitrixBotService.sendMessage({
      DIALOG_ID: chat_id,
      MESSAGE:
        `[user=${advertDepartment.UF_HEAD}][/user][br]` +
        '[b]Согласование наших сайтов перед передачей сделки на РК.[/b][br]' +
        'Нужно согласовать и принять наш сайт в работу РК.[br]' +
        this.bitrixService.generateTaskUrl(
          advertDepartment.UF_HEAD,
          taskId,
          'Согласование нашего сайта отделу сопровождения для передачи сделки на РК',
        ),
      KEYBOARD: keyboard,
    });
  }

  /**
   * Function handle incomng webhook from bitrix24.
   * When deal stay in stage **converted** bitrix send request.
   * Function send message to project manager with two buttons
   * and if ignored is true function send message to Irina Navolockaya
   * with message that manager doesnt approve site
   *
   * ---
   *
   * Функция обрабатывает исходящий вебхук из битркис24.
   * На стадии **сделка успешна** битрикс отправляет запрос.
   * Ф-я отправляет сообщение менеджеру с двумя кнопками и если установлен параметр ignored в значении true,
   * отправляет сообщение Ирине Наволоцкой о том, что менеджер не проверил сайт.
   * @param ignored
   * @param assignedId
   * @param dealId
   */
  async handleIncomingWebhookToApproveSiteForCase(
    { ignored, assignedId }: IncomingWebhookApproveSiteForCase,
    dealId: string,
  ) {
    if (ignored) {
      this.bitrixBotService.sendMessage({
        DIALOG_ID: this.bitrixService.ADDY_CASES_CHAT_ID, // Чат для кейсов
        MESSAGE:
          'Сделка завершена. Менеджер не отметил сайт для кейса[br]Сделка: ' +
          this.bitrixService.generateDealUrl(dealId),
      });
    }

    const message =
      '[b]Сайты для кейсов[/b][br][br]' +
      'Разработка сайта завершена![br]Укажи, отвечает ли сайт на требования хотя бы одного из пунктов[br][br]' +
      '[b]Критерии отбора сайтов для кейсов:[/b][br]' +
      '- Яркий, запоминающийся, нетипичный дизайн (не все подряд индивиды, ' +
      'а когда наши дизайнеры прыгнули выше головы и сделали очень крутой дизайн)+ ' +
      'Если есть сомнения по этому пункту, то всё равно отправляйте Ирине на согласование+[br]' +
      '- Наличие технических особенностей (личные кабинеты, интеграции, наличие анимаций, сложная карточка товара и прочее)[br]' +
      '- ВСЕ сайты на Bitrix (вне зависимости от дизайна и тех+особенностей)[br]' +
      '- ВСЕ индивидуальные сайты Вологодских заказчиков (вне зависимости от дизайна и тех+особенностей)[br]' +
      '- Нетиповые некоммерческие проекты (например, новостной портал)+[br]' +
      '- Сайты, которые делали для гос+структур (больницы и прочее)[br][br]Сделка: ' +
      this.bitrixService.generateDealUrl(dealId);

    const keyboardParams: ImbotKeyboardApproveSiteForCase = {
      approved: true,
      dealId: dealId,
      oldMessage: this.bitrixBotService.encodeText(message),
    };

    this.bitrixBotService.sendMessage({
      DIALOG_ID: assignedId,
      MESSAGE: message,
      KEYBOARD: [
        {
          TEXT: 'Сайт подходит',
          COMMAND: 'approveSiteForCase',
          COMMAND_PARAMS: JSON.stringify(keyboardParams),
          BG_COLOR_TOKEN: 'primary',
          DISPLAY: 'LINE',
        },
        {
          TEXT: 'Сайт не подходит',
          COMMAND: 'approveSiteForCase',
          COMMAND_PARAMS: JSON.stringify({
            ...keyboardParams,
            approved: false,
          } as ImbotKeyboardApproveSiteForCase),
          BG_COLOR_TOKEN: 'alert',
          DISPLAY: 'LINE',
        },
      ],
    });

    return true;
  }

  async handleVoxImplantCallInitTask(fields: B24EventVoxImplantCallInitDto) {
    const {
      CALL_ID: callId,
      CALL_TYPE: callType,
      CALLER_ID: phone,
    } = fields.data;

    if (callType !== B24CallType.INCOMING)
      return {
        status: false,
        message: `Call is not ${B24CallType.INCOMING}`,
        phone: phone,
        callId: callId,
      };

    const clientPhone = /\+/gi.test(phone) ? phone : `+${phone}`;

    const wasHandled = await this.redisService.get<string>(
      REDIS_KEYS.BITRIX_DATA_WEBHOOK_VOXIMPLANT_CALL_INIT + phone,
    );

    if (wasHandled) throw new ConflictException('call was handled');

    this.redisService.set<string>(
      REDIS_KEYS.BITRIX_DATA_WEBHOOK_VOXIMPLANT_CALL_INIT + phone,
      phone,
      60, // 1 minute
    );

    // this.logger.debug(`init call handle: ${phone}`, 'log');

    this.queueLightService.addTaskHandleWebhookFromBitrixOnVoxImplantCallInit({
      callId: callId,
      phone: clientPhone,
    });
    return true;
  }

  /**
   * Handle init call bitrix24 webhook and distribute by departments
   *
   * ---
   *
   * Обработка инициализации звонка и распределение обработки по отедлам
   * @param fields
   */
  async handleVoxImplantCallInit(
    fields: B24WebhookVoxImplantCallInitTaskOptions,
  ) {
    const { phone: clientPhone } = fields;

    // Получаем текущие звонки
    const currentCalls = await this.telphinService.getCurrentCalls();

    this.logger.info(
      {
        message: 'check current calls',
        phone: clientPhone,
        currentCalls,
      },
      true,
    );

    // Ищем текущий звонок по номеру телефона
    const targetCalls = currentCalls.filter(
      ({ call_flow, called_number, caller_id_name, caller_id_number }) =>
        call_flow === 'IN' &&
        [caller_id_name, caller_id_number].includes(clientPhone),
    );

    this.logger.info(
      {
        message: 'check current calls and finded target call by client phone',
        currentCalls,
        targetCalls,
      },
      true,
    );

    // Если не нашли текущий звонок по номеру клиента: выходим
    if (targetCalls.length === 0)
      throw new NotFoundException('Call in call list was not found');

    const { called_did: calledDid } = targetCalls[0];

    // Получаем группу
    const [extensionGroup, extension] = await Promise.all([
      this.telphinService.getExtensionGroupById(
        targetCalls[0].called_extension.extension_group_id,
      ),
      this.telphinService.getClientExtensionById(
        targetCalls[0].called_extension.id,
      ),
    ]);

    this.logger.info(
      {
        message: 'check extension group',
        extensionGroup,
      },
      true,
    );

    if (!extensionGroup)
      throw new NotFoundException('Extension group was not found');

    if (!extension) throw new NotFoundException('Extension was not found');

    // Вытаскиваем имя группы
    const { name: extensionGroupName } = extensionGroup;

    // Заносим в кеш информацию о номере клиента и группе внутреннего номера менеджера
    this.redisService.set<B24WebhookVoxImplantCallInitOptions>(
      REDIS_KEYS.BITRIX_DATA_WEBHOOK_VOXIMPLANT_CALL_INIT + calledDid,
      {
        clientPhone: clientPhone,
        extensionGroup: extensionGroup,
      },
      180, // 3 minutes
    );

    // Распределяем логику по отделам
    switch (true) {
      // Отдел продаж
      case /sale/gi.test(extensionGroupName):
        return this.handleVoxImplantCallInitForSaleManagers({
          phone: clientPhone,
          extension: extension,
          group: extensionGroup,
          calls: targetCalls,
          called_did: targetCalls[0].called_did,
        });

      default:
        return false;
    }
  }

  /**
   * Handle init call for sale department
   *
   * ---
   *
   * Обработка инициализации звонка для отдела продаж
   * @param clientPhone
   * @param extensionExtraParamsEncoded
   * @param extensionPhone
   * @param calledDid
   * @param calls
   * @param extensionGroupId
   */
  async handleVoxImplantCallInitForSaleManagers({
    phone: clientPhone,
    extension: {
      extra_params: extensionExtraParamsEncoded,
      ani: extensionPhone,
    },
    called_did: calledDid,
    calls,
    group: { id: extensionGroupId },
  }: B24WebhookHandleCallInitForSaleManagersOptions) {
    // Ищем лид по номеру телефона
    // Получаем список внутренних номеров все sale отделов
    const [leadIds, saleExtensionList] = await Promise.all([
      this.bitrixLeadService.getDuplicateLeadsByPhone(clientPhone),
      this.telphinService.getExtensionGroupExtensionListByGroupIds([
        extensionGroupId,
      ]),
    ]);

    if (saleExtensionList.length === 0)
      throw new NotFoundException('Extension list is empty');

    this.logger.info(
      {
        message: 'check extension phone and saleList from telphin',
        saleExtensionList,
        extensionPhone,
        leadIds,
      },
      true,
    );

    if (
      calls.length > 1 &&
      calledDid &&
      calledDid in this.bitrixService.AVITO_PHONES
    ) {
      // Если клиент звонит на авито
      const avitoName = this.bitrixService.AVITO_PHONES[calledDid];
      const callAvitoCommands: B24BatchCommands = {};

      let notifyMessageAboutAvitoCall = '';

      if (leadIds.length === 0) {
        // Если лид не найден
        notifyMessageAboutAvitoCall = `Новый лид с Авито [${avitoName}]. Бери в работу!`;
      } else {
        //   Если нашли лид

        // Получаем информацию о лиде
        const leadInfo = await this.bitrixLeadService.getLeadById(
          leadIds[0].toString(),
        );

        if (!leadInfo)
          throw new NotFoundException(`Lead [${leadIds[0]}] was not found`);

        const { STATUS_ID: leadStatusId } = leadInfo;

        switch (true) {
          case B24LeadNewStages.includes(leadStatusId): // Лид в новых стадиях
            notifyMessageAboutAvitoCall = 'Новый лид. Бери в работу!';
            break;

          case B24LeadRejectStages.includes(leadStatusId): // Лид в неактивных стадиях
            notifyMessageAboutAvitoCall =
              'Клиент в неактивной стадии. Бери в работу себе';
            break;

          case B24LeadConvertedStages.includes(leadStatusId): // Лид в завершаюих стадиях
            notifyMessageAboutAvitoCall = `Ответь сразу! Действующий клиент звонит на авито [${avitoName}]. Скажи, что передашь обращение ответственному менеджеру/руководителю`;
            break;

          default:
            notifyMessageAboutAvitoCall = `Ответь сразу! Клиент звонит на Авито [${avitoName}] повторно. Скажи, что передашь его обращение ответственному менеджеру`;
            break;
        }
      }

      // Отправляем всем сотрудникам уведомление
      saleExtensionList.forEach(({ extra_params }) => {
        const extraParamsDecoded: TelphinExtensionItemExtraParams =
          JSON.parse(extra_params);

        if (!extraParamsDecoded) return;

        callAvitoCommands[`notify_manager=${extraParamsDecoded.comment}`] = {
          method: 'im.notify.system.add',
          params: {
            USER_ID: extraParamsDecoded.comment,
            MESSAGE: notifyMessageAboutAvitoCall,
          },
        };
      });

      this.logger.info(
        {
          message: 'check batch commands on avito number',
          callAvitoCommands,
        },
        true,
      );

      this.bitrixService.callBatch(callAvitoCommands);
    } else {
      // Если клиент звонит напрямую
      const callManagerCommands: B24BatchCommands = {};
      let notifyManagerMessage: string;

      // Так как клиент звонит напрямую,
      // то мы без проблем можем вытянуть user bitrix id
      // из поля [Комментарий] в телфине
      const extensionExtraParamsDecoded: TelphinExtensionItemExtraParams =
        JSON.parse(extensionExtraParamsEncoded);

      if (!extensionExtraParamsDecoded)
        throw new BadRequestException(
          'Invalid get assigned bitrix id by extension',
        );

      // Если лид не найден
      if (leadIds.length === 0) {
        // создаем лид
        notifyManagerMessage =
          'Клиент звонит тебе. Лид не найден (Действующий с другого номера или по рекомендации)';
      } else {
        // Если лид найден
        const leadId = leadIds[0].toString();
        const lead = await this.bitrixLeadService.getLeadById(leadId);

        if (!lead) throw new BadRequestException('Lead was not found');

        const { STATUS_ID: leadStatusId } = lead;

        switch (true) {
          case B24LeadRejectStages.includes(leadStatusId):
            notifyManagerMessage =
              'Клиент в неактивной стадии Бери в работу себе';
            this.bitrixLeadService.updateLead({
              id: leadId,
              fields: {
                ASSIGNED_BY_ID: extensionExtraParamsDecoded.comment,
                STATUS_ID: B24LeadActiveStages[0], // Новый в работе
              },
            });
            break;

          default:
            notifyManagerMessage = 'Звонит твой клиент - отвечай';
            break;
        }
      }

      // Уведомляем пользователя
      callManagerCommands['notify_manager'] = {
        method: 'im.notify.system.add',
        params: {
          USER_ID: extensionExtraParamsDecoded.comment,
          MESSAGE: notifyManagerMessage,
        },
      };

      this.logger.info(
        {
          message: 'check batch commands on target number',
          callManagerCommands,
        },
        true,
      );

      // Отправляем запрос
      this.bitrixService.callBatch(callManagerCommands);
    }

    return {
      status: true,
      message: 'successfully handle call init for sale managers',
    };
  }

  /**
   * Handle call start from bitrix24 webhook. Add in tasks queue
   *
   * ---
   *
   * Обработка начала звонка из битркис24. Добавляет в очередь задач
   * @param fields
   */
  async handleVoxImplantCallStartTask(fields: B24EventVoxImplantCallStartDto) {
    this.queueLightService.addTaskHandleWebhookFromBitrixOnVoxImplantCallStart(
      {
        callId: fields.data.CALL_ID,
        userId: fields.data.USER_ID,
      },
      {
        delay: 500,
      },
    );
    return true;
  }

  /**
   * Handle call start tasks from queue and distribute handle on departments
   *
   * ---
   *
   * Обрабатывает начало звонка из очереди задач и распределяет по отделам
   * @param fields
   */
  async handleVoxImplantCallStart(
    fields: B24WebhookVoxImplantCallStartOptions,
  ) {
    try {
      const { callId, userId } = fields;

      /**
       * Получаем внутренний номер менеджера по bitrix_id
       * Получаем список текущих звонков
       */
      const [managerExtension, currentCalls] = await Promise.all([
        this.telphinService.getClientExtensionByBitrixUserId(userId),
        this.telphinService.getCurrentCalls(),
      ]);

      this.logger.info(
        {
          message: 'check manager extension by user_id and current call list',
          userId: userId,
          manager: managerExtension,
          calls: currentCalls,
        },
        true,
      );

      if (!managerExtension) {
        // this.logger.debug(`Invalid get manager extension: ${userId}`, 'fatal');
        throw new BadRequestException(
          `Invalid find extension number by bitrix id`,
        );
      }

      // Ищем менеджера в текущих звонках
      const managerExtensionInCallList = currentCalls.find(
        ({ call_flow, extension_id: extensionId }) =>
          managerExtension.id === extensionId && call_flow == 'IN',
      );

      if (!managerExtensionInCallList) {
        this.logger.error(
          `Invalid get manager extension in call list: ${managerExtension.name}`,
          true,
        );
        throw new NotFoundException('Invalid find manager in current calls');
      }

      // Забираем номер с которого звонит клиент
      const { called_did: calledDid } = managerExtensionInCallList;

      if (!calledDid) {
        this.logger.error(`Invalid get called_did: ${userId}`, true);
        throw new BadRequestException('Invalid get called_did field');
      }

      const callWasWritten = await this.redisService.get<string>(
        REDIS_KEYS.BITRIX_DATA_WEBHOOK_VOXIMPLANT_CALL_START + calledDid,
      );

      if (callWasWritten) {
        this.logger.error(`Call was accepted: ${calledDid}`, true);
        throw new ConflictException('Call was accepted');
      }

      this.redisService.set<string>(
        REDIS_KEYS.BITRIX_DATA_WEBHOOK_VOXIMPLANT_CALL_START + calledDid,
        callId,
        60, // 1 minute
      );

      this.logger.info(
        {
          message: 'Check handle start call',
          fields,
        },
        true,
      );

      // Пытаемся получить из кеша информацию о номере клиента и группе внутреннего номера менеджера
      const callData =
        await this.redisService.get<B24WebhookVoxImplantCallInitOptions>(
          REDIS_KEYS.BITRIX_DATA_WEBHOOK_VOXIMPLANT_CALL_INIT + calledDid,
        );

      if (!callData) {
        // this.logger.debug('Invalid get call data', 'fatal');
        throw new BadRequestException(`Invalid get call data: ${calledDid}`);
      }

      const {
        clientPhone,
        extensionGroup: { name: extensionGroupName },
      } = callData;

      // // fixme: Для теста
      // if (!/(79517354601|79211268209)/gi.test(clientPhone)) {
      //   this.logger.debug(`is not tested: ${calledDid}`, 'warn');
      //   return {
      //     status: true,
      //     message: 'In tested',
      //   };
      // }

      this.logger.info({
        message: `check client phone`,
        userId: userId,
        phone: clientPhone,
      });

      // Распределяем в зависимости от группы
      switch (true) {
        case /sale/gi.test(extensionGroupName):
          return this.handleVoxImplantCallStartForSaleManagers({
            phone: clientPhone,
            userId: userId,
            calledDid: calledDid,
          });

        default:
          return {
            status: false,
            message: 'Not handled yet on call start',
          };
      }
    } catch (error) {
      this.logger.error(
        {
          message: 'error on handle call start',
          error,
        },
        true,
      );
      throw error;
    }
  }

  /**
   * Handle start call for sale managers
   *
   * ---
   *
   * Обрабатывает начало звонка для отедла продаж
   * @param fields
   */
  async handleVoxImplantCallStartForSaleManagers(
    fields: B24WebhookHandleCallStartForSaleManagersOptions,
  ) {
    const { userId, phone, calledDid } = fields;
    let response: any;

    if (!phone) throw new BadRequestException('Invalid phone');

    const leadIds = await this.bitrixLeadService.getDuplicateLeadsByPhone(
      phone,
      true,
    );

    if (calledDid && calledDid in this.bitrixService.AVITO_PHONES) {
      // Если клиент звонит на авито номер

      if (leadIds.length === 0) {
        response = await this.bitrixLeadService.createLead({
          ASSIGNED_BY_ID: userId,
          STATUS_ID: B24LeadActiveStages[0], // Новый в работе
          PHONE: [
            {
              VALUE: phone,
              VALUE_TYPE: 'WORK',
            },
          ],
        });
      } else {
        const leadInfo = await this.bitrixLeadService.getLeadById(
          leadIds[0].toString(),
        );

        if (!leadInfo) throw new BadRequestException('Lead was not found');

        const { ID: leadId, STATUS_ID: leadStatusId } = leadInfo;

        switch (true) {
          case B24LeadNewStages.includes(leadStatusId): // Лид в новых стадиях
          case B24LeadRejectStages.includes(leadStatusId): // Лид в Неактивных стадиях
            response = this.bitrixLeadService.updateLead({
              id: leadId,
              fields: {
                ASSIGNED_BY_ID: userId,
                STATUS_ID: B24LeadActiveStages[0], // Новый в работе
              },
            });
            break;
        }
      }
    } else {
      // Если клиент звонит напрямую менеджеру

      if (leadIds.length === 0) {
        // Если лида по номеру не найдено

        // Создаем лид
        response = await this.bitrixLeadService.createLead({
          ASSIGNED_BY_ID: userId,
          STATUS_ID: B24LeadActiveStages[0], // Новый в работе,
          PHONE: [
            {
              VALUE: phone,
              VALUE_TYPE: 'WORK',
            },
          ],
        });
      } else {
        const leadId = leadIds[0].toString();
        const lead = await this.bitrixLeadService.getLeadById(leadId);

        if (!lead) throw new BadRequestException('Lead was not found');

        const { STATUS_ID: leadStatusId } = lead;

        switch (true) {
          case B24LeadRejectStages.includes(leadStatusId):
            response = await this.bitrixLeadService.updateLead({
              id: leadId,
              fields: {
                STATUS_ID: B24LeadActiveStages[0], // Новый в работе
                ASSIGNED_BY_ID: userId,
              },
            });
            break;
        }
      }
    }

    // this.logger.debug(response, 'log');

    return {
      status: true,
      message: 'Successfully handled start call',
      response: response,
    };
  }
}
