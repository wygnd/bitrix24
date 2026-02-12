import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { IncomingWebhookDistributeDealDto } from '@/modules/bitrix/application/dtos/webhooks/incoming-webhook-distribute-deal.dto';
import { IncomingWebhookApproveSiteDealDto } from '@/modules/bitrix/application/dtos/webhooks/incoming-webhook-approve-site-deal.dto';
import { IncomingWebhookApproveSiteForCase } from '@/modules/bitrix/application/dtos/webhooks/incoming-webhook-approve-site-for-case.dto';
import { B24EventVoxImplantCallInitDto } from '@/modules/bitrix/application/dtos/events/event-voximplant-call-init.dto';
import {
  B24WebhookHandleCallInitForSaleManagersOptions,
  B24WebhookVoxImplantCallInitOptions,
  B24WebhookVoxImplantCallInitTaskOptions,
} from '@/modules/bitrix/application/interfaces/webhooks/webhook-voximplant-calls.interface';
import { RedisService } from '@/modules/redis/redis.service';
import { WikiService } from '@/modules/wiki/wiki.service';
import { TelphinService } from '@/modules/telphin/telphin.service';
import { QueueLightService } from '@/modules/queue/queue-light.service';
import {
  B24Department,
  B24DepartmentTypeId,
} from '@/modules/bitrix/application/interfaces/departments/departments.interface';
import {
  WebhookUserData,
  WebhookUserItem,
} from '@/modules/bitrix/application/interfaces/webhooks/webhook-user.interface';
import { REDIS_KEYS } from '@/modules/redis/redis.constants';
import { B24BatchCommands } from '@/modules/bitrix/interfaces/bitrix.interface';
import { B24User } from '@/modules/bitrix/application/interfaces/users/user.interface';
import { DistributeAdvertDealWikiResponse } from '@/modules/wiki/interfaces/wiki-distribute-deal.interface';
import { isAxiosError } from 'axios';
import { B24Emoji, B24PORTS } from '@/modules/bitrix/bitrix.constants';
import { B24ImKeyboardOptions } from '@/modules/bitrix/application/interfaces/messages/messages.interface';
import { WebhookDepartmentInfo } from '@/modules/bitrix/application/interfaces/webhooks/webhook-department-info.interface';
import {
  ImbotHandleApproveSiteDealOptions,
  ImbotHandleDistributeNewDeal,
} from '@/modules/bitrix/application/interfaces/bot/imbot-handle.interface';
import { B24Deal } from '@/modules/bitrix/application/interfaces/deals/deals.interface';
import { ImbotKeyboardApproveSiteForCase } from '@/modules/bitrix/application/interfaces/bot/imbot-keyboard-approve-site-for-case.interface';
import { B24CallType } from '@/modules/bitrix/interfaces/bitrix-call.interface';
import {
  B24LeadConvertedStages,
  B24LeadNewStages,
  B24LeadRejectStages,
} from '@/modules/bitrix/application/constants/leads/lead.constants';
import { TelphinExtensionItemExtraParams } from '@/modules/telphin/interfaces/telphin-extension.interface';
import { WinstonLogger } from '@/config/winston.logger';
import type { BitrixPort } from '@/modules/bitrix/application/ports/common/bitrix.port';
import type { BitrixBotPort } from '@/modules/bitrix/application/ports/bot/bot.port';
import type { BitrixLeadsPort } from '@/modules/bitrix/application/ports/leads/leads.port';
import {
  AvitoPhoneList,
  Bitrix1CPhoneList,
  FLPhoneList,
  ProfiRUPhoneList,
} from '@/modules/bitrix/application/constants/avito/avito.constants';
import { BitrixDepartmentsUseCase } from '@/modules/bitrix/application/use-cases/departments/departments.use-case';
import type { BitrixTasksPort } from '@/modules/bitrix/application/ports/tasks/tasks.port';
import dayjs from 'dayjs';

@Injectable()
export class BitrixWebhooksUseCase {
  private readonly logger = new WinstonLogger(
    BitrixWebhooksUseCase.name,
    'bitrix:webhooks'.split(':'),
  );
  private readonly departmentPrefix = {
    advert: 'РК',
    seo: 'SEO',
  };
  private lastSelectedDepartmentId: Record<string, string> = {};
  private readonly departmentInfo: Record<
    B24DepartmentTypeId,
    WebhookDepartmentInfo
  > = {
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

  constructor(
    private readonly redisService: RedisService,
    private readonly wikiService: WikiService,
    private readonly telphinService: TelphinService,
    private readonly queueLightService: QueueLightService,
    private readonly bitrixDepartments: BitrixDepartmentsUseCase,
    @Inject(B24PORTS.BITRIX)
    private readonly bitrixService: BitrixPort,
    @Inject(B24PORTS.BOT.BOT_DEFAULT)
    private readonly bitrixBot: BitrixBotPort,
    @Inject(B24PORTS.LEADS.LEADS_DEFAULT)
    private readonly bitrixLeads: BitrixLeadsPort,
    @Inject(B24PORTS.TASKS.TASKS_DEFAULT)
    private readonly bitrixTasks: BitrixTasksPort,
  ) {}

  /**
   * Function handle incoming webhook from bitrix
   * Get all employers department and form message for distribute deals
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
      this.bitrixDepartments.DEPARTMENT_TYPE_IDS(department);

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
        Record<string, B24User[]>
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
            await this.bitrixDepartments.getHeadCountDealAtLastMonthRate([
              '36',
              '54',
              '124',
              '128',
            ]),
          );
          const [departmentFiltered] =
            await this.bitrixDepartments.getDepartmentByUserId(
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
          this.bitrixBot.sendMessage({
            DIALOG_ID: this.bitrixService.getConstant('TEST_CHAT_ID'),
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
        BOT_ID: this.bitrixService.getConstant('BOT_ID'),
        DIALOG_ID: this.departmentInfo[department].chatId,
        MESSAGE: message,
        KEYBOARD: messageKeyboard,
      },
    };

    // Отправляем запрос
    this.bitrixService.callBatch(batchCommandsSendMessage);
    return true;
  }

  async handleIncomingWebhookToApproveSiteDeal(
    fields: IncomingWebhookApproveSiteDealDto,
    dealId: string,
  ) {
    const {
      project_manager_id: projectManagerId,
      chat_id: chatId,
      category,
    } = fields;

    // Определяем префикс РК|SEO
    const departmentPrefix =
      category in this.departmentPrefix ? this.departmentPrefix[category] : '';

    let departments: B24Department[];

    // В зависимости от категории получаем подразделения
    switch (category) {
      case 'advert':
        departments = await this.bitrixDepartments.getDepartmentById([
          '36', // КР 1
          '54', // КР 2
          '124', // КР 3
          '128', // КР 4
        ]);
        break;

      case 'seo':
        departments = await this.bitrixDepartments.getDepartmentById(['92']); // Отдел тех. SEO исполнения
        break;

      default:
        this.logger.error({
          handler: this.handleIncomingWebhookToApproveSiteDeal.name,
          message: 'Поле [category] не передано',
          fields,
        });
        return false;
    }

    if (departments.length === 0) {
      this.logger.error({
        handler: this.handleIncomingWebhookToApproveSiteDeal.name,
        message: 'Ошибка получения списка подразделений',
        fields,
      });
      return false;
    }

    // Получаем отдел в случайном порядке
    let department =
      this.bitrixService.getRandomElement<B24Department>(departments);

    if (
      category in this.lastSelectedDepartmentId &&
      this.lastSelectedDepartmentId[category] === department.ID
    ) {
      department =
        this.bitrixService.getRandomElement<B24Department>(departments);
    }

    this.lastSelectedDepartmentId[category] = department.ID;

    const batchCommandsGetInfo: B24BatchCommands = {
      get_deal: {
        method: 'crm.deal.get',
        params: {
          id: dealId,
        },
      },
    };

    let relatedDealCategory: string[];
    let selectRelatedDealCategory: (keyof B24Deal)[] = ['ID'];

    // В зависимости от категории получаем либо сделку РК, либо SEO, а также комментарий
    switch (category) {
      case 'advert':
        relatedDealCategory = ['1']; // Воронка: Настройка РК
        selectRelatedDealCategory.push('UF_CRM_1716383143'); // Комментарий к сделке РК
        break;

      case 'seo':
        relatedDealCategory = ['7', '16', '34']; // Воронки: внутренняя, внешняя, базовая оптимизация
        selectRelatedDealCategory.push('UF_CRM_1760519929'); // Комментарий к сделке SEO
        break;
    }

    batchCommandsGetInfo['get_related_deal'] = {
      method: 'crm.deal.list',
      params: {
        FILTER: {
          UF_CRM_1731418991: '$result[get_deal][UF_CRM_1731418991]', // Лид айди
          '@CATEGORY': relatedDealCategory,
        },
        SELECT: selectRelatedDealCategory,
      },
    };

    const { result: batchResponseGetInfo } =
      await this.bitrixService.callBatch<{
        get_deal: B24Deal;
        get_related_deal: B24Deal[];
      }>(batchCommandsGetInfo);

    this.logger.debug({
      message: 'check batch commands and result on approve site',
      batchCommandsGetInfo,
      batchResponseGetInfo,
    });

    if (Object.keys(batchResponseGetInfo.result_error).length !== 0)
      throw new BadRequestException(batchResponseGetInfo.result_error);

    const { get_deal: deal, get_related_deal: relatedDeal } =
      batchResponseGetInfo.result;

    let taskDescription: string;

    // В зависимости от категории собираем комментарий из сделки
    switch (category) {
      case 'advert':
        taskDescription =
          (deal?.UF_CRM_1600184739 ? `${deal.UF_CRM_1600184739}\n` : '') +
          'Если нет замечаний, то завершай задачу и в сообщении нажми на кнопку [b]Согласованно[/b]\n\n' +
          'Если есть правки, то:\n- НЕ завершай задачу\n' +
          '- Пропиши в комментариях задачи список правок\n' +
          '- Нажми в сообщении кнопку [b]Не согласованно[/b]\n\n' +
          (relatedDeal.length > 0 && relatedDeal[0]?.UF_CRM_1716383143
            ? `Комментарий сделки ${departmentPrefix}:\n${relatedDeal[0]?.UF_CRM_1716383143}`
            : '');
        break;

      case 'seo':
        taskDescription =
          '[b]Задачу не завершать![/b]\n\n' +
          `Если нет замечаний, то написать комментарий "Согласованно" и отправить задачу в ЛС [user=${department.UF_HEAD}]Степану Комягину[/user]` +
          'Если есть правки, то:\n' +
          '- Пропиши в комментариях задачи список правок\n' +
          `- Отправь задачу в ЛС [user=${department.UF_HEAD}]Степану Комягину[/user]`;
        break;
    }

    const task = await this.bitrixTasks.createTask({
      TITLE: `Необходимо проверить сайт на дееспособность работы на ${departmentPrefix}.`,
      DEADLINE: dayjs().format('YYYY-MM-DD') + 'T18:00:00',
      DESCRIPTION: taskDescription,
      CREATED_BY: '460',
      RESPONSIBLE_ID: department.UF_HEAD,
      UF_CRM_TASK: [`D_${dealId}`],
      ACCOMPLICES: departments
        .filter((d) => d.ID !== department.ID)
        .map((d) => d.UF_HEAD),
      AUDITORS: [projectManagerId],
    });

    this.logger.debug({
      message: 'check create task on approve site',
      task,
    });

    if (!task) {
      this.logger.debug({
        message: 'Invalid create task',
        fields,
      });
      return false;
    }

    // Собираем данные кнопок
    const keyboardItemParams: ImbotHandleApproveSiteDealOptions = {
      dealId: dealId,
      isApprove: true,
      managerId: projectManagerId,
      category: category,
      taskId: task.id,
    };

    // Собираем кнопки
    const keyboard: B24ImKeyboardOptions[] = [
      {
        TEXT: 'Согласованно',
        COMMAND: 'approveSiteDealFor',
        COMMAND_PARAMS: JSON.stringify(keyboardItemParams),
        BG_COLOR_TOKEN: 'primary',
        DISPLAY: 'LINE',
        BLOCK: 'Y',
      },
      {
        TEXT: 'Не согласованно',
        COMMAND: 'approveSiteDealFor',
        COMMAND_PARAMS: JSON.stringify({
          ...keyboardItemParams,
          isApprove: false,
        }),
        BG_COLOR_TOKEN: 'alert',
        DISPLAY: 'LINE',
        BLOCK: 'Y',
      },
    ];

    this.bitrixBot
      .sendMessage({
        DIALOG_ID: chatId,
        MESSAGE:
          `[user=${department.UF_HEAD}][/user][br]` +
          `[b]Согласование наших сайтов перед передачей сделки на ${departmentPrefix}.[/b][br]` +
          `Нужно согласовать и принять наш сайт в работу ${departmentPrefix}.[br]` +
          this.bitrixService.generateTaskUrl(
            department.UF_HEAD,
            task.id,
            `Согласование нашего сайта отделу сопровождения для передачи сделки на ${departmentPrefix}`,
          ) +
          '[br][br]Сделка: ' +
          this.bitrixService.generateDealUrl(dealId),
        KEYBOARD: keyboard,
      })
      .then((res) => this.logger.debug(res))
      .catch((err) => this.logger.error(err));
    return true;
  }

  async testHook() {
    return this.bitrixDepartments.getDepartmentList();
  }

  /**
   * Function handle incomng webhook from bitrix24.
   * When deals stay in stage **converted** bitrix send request.
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
      this.bitrixBot.sendMessage({
        DIALOG_ID: this.bitrixService.getConstant('ADDY').casesChatId, // Чат для кейсов
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
      oldMessage: this.bitrixBot.encodeText(message),
    };

    this.bitrixBot.sendMessage({
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
      10, // 10 seconds
    );

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

    // this.logger.debug({
    //   message: 'check current calls',
    //   phone: clientPhone,
    //   currentCalls,
    // });

    // Ищем текущий звонок по номеру телефона
    const targetCalls = currentCalls.filter(
      ({ call_flow, called_number, caller_id_name, caller_id_number }) =>
        call_flow === 'IN' &&
        [caller_id_name, caller_id_number].includes(clientPhone),
    );

    // this.logger.debug({
    //   message: 'check current calls and finded target call by client phone',
    //   currentCalls,
    //   targetCalls,
    // });

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

    // this.logger.debug({
    //   message: 'check extension group',
    //   extensionGroup,
    // });

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
   * @param fields
   */
  async handleVoxImplantCallInitForSaleManagers(
    fields: B24WebhookHandleCallInitForSaleManagersOptions,
  ) {
    const {
      phone: clientPhone,
      extension: {
        extra_params: extensionExtraParamsEncoded,
        ani: extensionPhone,
      },
      called_did: calledDid = '',
      calls,
      group: { id: extensionGroupId },
    } = fields;

    // Ищем лид по номеру телефона
    // Получаем список внутренних номеров все sale отделов
    const [leadIds, saleExtensionList] = await Promise.all([
      this.bitrixLeads.getDuplicateLeadsByPhone(clientPhone),
      this.telphinService.getExtensionGroupExtensionListByGroupIds([
        extensionGroupId,
      ]),
      calledDid && calledDid in Bitrix1CPhoneList
        ? this.bitrixService.callMethod('im.message.add', {
            DIALOG_ID: '114', // Дмитрий Андреев,
            MESSAGE: `Звонок по 1С с номера: [b]${clientPhone}[/b]`,
          })
        : null,
    ]);

    if (saleExtensionList.length === 0)
      throw new NotFoundException('Extension list is empty');

    this.logger.debug({
      message: 'check extension phone and saleList from telphin',
      saleExtensionList,
      extensionPhone,
      leadIds,
    });

    if (calls.length === 0) {
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
        const lead = await this.bitrixLeads.getLeadById(leadId);

        if (!lead) throw new BadRequestException('Lead was not found');

        const { STATUS_ID: leadStatusId } = lead;

        switch (true) {
          case B24LeadRejectStages.includes(leadStatusId):
            notifyManagerMessage =
              'Клиент в неактивной стадии Бери в работу себе';
            break;

          default:
            notifyManagerMessage = 'Звонит твой клиент - отвечай';
            break;
        }
      }

      if (calledDid && calledDid in Bitrix1CPhoneList)
        notifyManagerMessage = 'Звонок по 1С ' + notifyManagerMessage;

      // Уведомляем пользователя
      callManagerCommands['notify_manager'] = {
        method: 'im.notify.system.add',
        params: {
          USER_ID: extensionExtraParamsDecoded.comment,
          MESSAGE: notifyManagerMessage,
        },
      };

      this.logger.debug({
        message: 'check batch commands on target number',
        callManagerCommands,
      });

      // Отправляем запрос
      this.bitrixService.callBatch(callManagerCommands);

      return {
        status: true,
        message: 'successfully handle call init for sale managers',
      };
    }

    const callAvitoCommands: B24BatchCommands = {};
    let source: string;

    switch (true) {
      case calledDid && calledDid in AvitoPhoneList:
        source = ` с авито [${AvitoPhoneList[calledDid]}] `;
        break;

      case calledDid && calledDid in FLPhoneList:
        source = ` c FL [${FLPhoneList[calledDid]}] `;
        break;

      case calledDid && calledDid in ProfiRUPhoneList:
        source = ` с ПРОФИ.РУ [${ProfiRUPhoneList[calledDid]}] `;
        break;

      case calledDid && calledDid in Bitrix1CPhoneList:
        source = ` [${Bitrix1CPhoneList[calledDid]}] `;
        break;

      default:
        source = '';
        break;
    }

    this.logger.debug({
      fields,
      source,
    });

    let notifyMessageAboutAvitoCall = '';

    if (leadIds.length === 0) {
      // Если лид не найден
      notifyMessageAboutAvitoCall = `Новый лид ${source}. Бери в работу!`;
    } else {
      //   Если нашли лид

      // Получаем информацию о лиде
      const leadInfo = await this.bitrixLeads.getLeadById(
        leadIds[0].toString(),
      );

      if (!leadInfo)
        throw new NotFoundException(`Lead [${leadIds[0]}] was not found`);

      const { STATUS_ID: leadStatusId } = leadInfo;

      switch (true) {
        case B24LeadNewStages.includes(leadStatusId): // Лид в новых стадиях
          notifyMessageAboutAvitoCall = `Новый лид${source}. Бери в работу!`;
          break;

        case B24LeadRejectStages.includes(leadStatusId): // Лид в неактивных стадиях
          notifyMessageAboutAvitoCall = `Клиент${source}в неактивной стадии. Бери в работу себе`;
          break;

        case B24LeadConvertedStages.includes(leadStatusId): // Лид в завершаюих стадиях
          notifyMessageAboutAvitoCall = `Ответь сразу! Действующий клиент звонит${source}. Скажи, что передашь обращение ответственному менеджеру/руководителю`;
          break;

        default:
          notifyMessageAboutAvitoCall = `Ответь сразу! Клиент звонит на Авито ${source} повторно. Скажи, что передашь его обращение ответственному менеджеру`;
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

    this.logger.debug({
      message: 'check batch commands on avito number',
      callAvitoCommands,
    });

    this.bitrixService.callBatch(callAvitoCommands);

    return {
      status: true,
      message: 'successfully handle call init for sale managers',
    };
  }
}
