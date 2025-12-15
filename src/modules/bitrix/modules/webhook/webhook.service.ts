import { BitrixService } from '@/modules/bitrix/bitrix.service';
import { BitrixImBotService } from '@/modules/bitrix/modules/imbot/imbot.service';
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
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
import { B24EventVoxImplantCallEndDto } from '@/modules/bitrix/modules/events/dtos/event-voximplant-call-end.dto';
import { TelphinService } from '@/modules/telphin/telphin.service';
import { TelphinCallItem } from '@/modules/telphin/interfaces/telphin-call.interface';
import { TelphinExtensionItem } from '@/modules/telphin/interfaces/telphin-extension.interface';
import {
  B24LeadActiveStages,
  B24LeadConvertedStages,
  B24LeadRejectStages,
} from '@/modules/bitrix/modules/lead/constants/lead.constants';
import { BitrixLeadService } from '@/modules/bitrix/modules/lead/services/lead.service';
import { WinstonLogger } from '@/config/winston.logger';

@Injectable()
export class BitrixWebhookService {
  private readonly departmentInfo: Record<
    B24DepartmentTypeId,
    WebhookDepartmentInfo
  >;
  private lastSelectedDepartmentId: string = '';
  private readonly logger = new WinstonLogger(BitrixWebhookService.name);

  constructor(
    private readonly bitrixService: BitrixService,
    private readonly bitrixBotService: BitrixImBotService,
    private readonly bitrixDepartmentService: BitrixDepartmentService,
    private readonly redisService: RedisService,
    private readonly wikiService: WikiService,
    private readonly bitrixLeadService: BitrixLeadService,
    private readonly telphinService: TelphinService,
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

  async handleVoxImplantCallFinish(fields: B24EventVoxImplantCallEndDto) {
    this.bitrixBotService.sendTestMessage(
      `[b]Calling Инициализация звонка[/b][br]Body: ${JSON.stringify(fields)}}`,
    );
    try {
      const { PHONE_NUMBER: phone, PORTAL_USER_ID: userId } = fields.data;
      let leadId = '';

      if (userId !== '522') return;

      // получаем информацию о клиенте telphin и пользователя с битрикс, кому позвонили
      const telphinUserInfo = await this.telphinService.getUserInfo();

      // если не получили информацию: пробрасываем ошибку
      if (!telphinUserInfo)
        throw new InternalServerErrorException('Invalid get info from telphin');

      const { client_id: telphinClientId } = telphinUserInfo;

      // Получаем текущие звонки и внутренний номер менеджера, кому звонят
      const [targetCalls, extension] = await Promise.all<
        [Promise<TelphinCallItem[]>, Promise<TelphinExtensionItem | null>]
      >([
        this.telphinService.getCurrentCalls(telphinClientId),
        this.telphinService.getClientExtensionByBitrixUserId(
          telphinClientId,
          userId,
        ),
      ]);

      if (!extension)
        throw new BadRequestException('Extension by user bitrix id not found');

      // Ищем внутренний номер в текущем списке звонков(кто на данный момент в звонке)
      const targetExtension = targetCalls.find(
        ({ call_flow, caller_extension: { id: extId } }) =>
          extId === extension.id && call_flow === 'IN',
      );

      this.logger.info(
        `Check current extension: ${extension.id} and calls: ${JSON.stringify(targetExtension)}`,
      );

      // Если не находим перца: выходим
      if (!targetExtension)
        throw new BadRequestException(
          'Extension in current calls was not found',
        );

      // Если не передан leadId, пытаемся найти лид по номеру телефона
      // Ищем дубликаты
      const duplicateLeads =
        await this.bitrixLeadService.getDuplicateLeadsByPhone(phone);

      // Если нет дубликатов: создаем лид
      if (duplicateLeads.length === 0) {
        const { result } = await this.bitrixLeadService.createLead({
          ASSIGNED_BY_ID: this.bitrixService.ZLATA_ZIMINA_BITRIX_ID,
          STATUS_ID: B24LeadActiveStages[0], // Новый в работе
          PHONE: [
            {
              VALUE: phone,
              VALUE_TYPE: 'WORK',
            },
          ],
        });

        if (!result) throw new BadRequestException('Ошибка при создании лида');

        leadId = result.toString();
      }

      const lead = await this.bitrixLeadService.getLeadById(leadId);

      if (!lead || !lead.result)
        throw new BadRequestException('Lead not found.');

      const { STATUS_ID: statusId } = lead.result;

      switch (true) {
        // Если лид в активных стадиях
        case B24LeadActiveStages.includes(statusId):
        case B24LeadConvertedStages.includes(statusId):
          break;

        // Если лид в неактивных стадиях
        case B24LeadRejectStages.includes(statusId):
          this.bitrixLeadService
            .updateLead({
              id: leadId,
              fields: {
                STATUS_ID: B24LeadActiveStages[0], // Новый в работе
                ASSIGNED_BY_ID: userId,
              },
            })
            .then((res) => {
              this.logger.info(`Result update lead: ${JSON.stringify(res)}`);
            })
            .catch((err) => {
              this.logger.error(
                `Execute error on update lead in rejected stages: ${JSON.stringify(err)}`,
              );
            });
          break;
      }

      return true;
    } catch (e) {
      this.logger.error(e, e?.stack, true);
      return false;
    }
  }
}
