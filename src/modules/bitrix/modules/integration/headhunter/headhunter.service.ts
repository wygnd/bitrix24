import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { HeadhunterRedirectDto } from '@/modules/bitrix/modules/integration/headhunter/dto/headhunter-redirect.dto';
import {
  HeadHunterAuthData,
  HeadHunterAuthTokens,
} from '@/modules/bitrix/modules/integration/headhunter/interfaces/headhunter-auth.interface';
import { REDIS_KEYS } from '@/modules/redis/redis.constants';
import { BitrixImBotService } from '@/modules/bitrix/modules/imbot/imbot.service';
import { HeadHunterService } from '@/modules/headhunter/headhunter.service';
import { RedisService } from '@/modules/redis/redis.service';
import { BitrixService } from '@/modules/bitrix/bitrix.service';
import { HeadhunterWebhookCallDto } from '@/modules/bitrix/modules/integration/headhunter/dto/headhunter-webhook-call.dto';
import { HHVacancyInterface } from '@/modules/headhunter/interfaces/headhunter-vacancy.interface';
import {
  ContactPhone,
  HHResumeInterface,
} from '@/modules/headhunter/interfaces/headhunter-resume.interface';
import { CandidateContactInterface } from '@/modules/bitrix/modules/integration/headhunter/interfaces/headhunter-create-deal.interface';
import { B24BatchResponseMap } from '@/modules/bitrix/interfaces/bitrix-api.interface';
import { B24Deal } from '@/modules/bitrix/modules/deal/interfaces/deal.interface';
import { BitrixUserService } from '@/modules/bitrix/modules/user/user.service';
import { BitrixDealService } from '@/modules/bitrix/modules/deal/deal.service';
import { HH_WEBHOOK_EVENTS } from '@/modules/bitrix/modules/integration/headhunter/headhunter.contstants';
import { HeadhunterRestService } from '@/modules/headhunter/headhunter-rest.service';
import { HHBitrixVacancy } from '@/modules/bitrix/modules/integration/headhunter/interfaces/headhunter-bitrix-vacancy.interface';
import { isAxiosError } from 'axios';
import { QueueHeavyService } from '@/modules/queue/queue-heavy.service';
import { HHNegotiationInterface } from '@/modules/headhunter/interfaces/headhunter-negotiation.interface';
import { B24BatchCommands } from '@/modules/bitrix/interfaces/bitrix.interface';
import { HeadhunterHandleDealHROptions } from '@/modules/bitrix/modules/integration/headhunter/interfaces/headhunter-handle-deal-from-headhunter.interface';
import { validateField } from '@/common/validators/validate-field.validator';
import { HeadHunterWebhookNegotiationOrRequestPayloadDto } from '@/modules/bitrix/modules/integration/headhunter/dto/headhunter-webhook-negotiation-or-request.dto';
import { HeadhunterWebhookNegotiationEmployerStateChangePayloadDto } from '@/modules/bitrix/modules/integration/headhunter/dto/headhunter-webhook-negotiation-employer-state-change.dto';
import { HeadhunterWebhookCallResponse } from '@/modules/bitrix/modules/integration/headhunter/interfaces/headhunter-webhook-call.interface';
import { B24DealHRRejectedStages } from '@/modules/bitrix/modules/deal/constants/deal-hr.constants';
import { B24Emoji } from '@/modules/bitrix/bitrix.constants';
import { WinstonLogger } from '@/config/winston.logger';
import { TokensService } from '@/modules/tokens/tokens.service';
import { TokensServices } from '@/modules/tokens/interfaces/tokens-serivces.interface';

@Injectable()
export class BitrixHeadHunterService {
  private readonly logger = new WinstonLogger(
    BitrixHeadHunterService.name,
    'bitrix:services'.split(':'),
  );

  constructor(
    private readonly bitrixImBotService: BitrixImBotService,
    private readonly headHunterApi: HeadHunterService,
    private readonly redisService: RedisService,
    private readonly bitrixService: BitrixService,
    private readonly bitrixUserService: BitrixUserService,
    private readonly bitrixDealService: BitrixDealService,
    private readonly headHunterRestService: HeadhunterRestService,
    private readonly queueHeavyService: QueueHeavyService,
    private readonly tokensService: TokensService,
  ) {}

  async handleApp(fields: any, query: HeadhunterRedirectDto) {
    try {
      const params = new URLSearchParams();
      params.append('grant_type', 'authorization_code');
      params.append('client_id', this.headHunterApi.HH_CLIENT_ID);
      params.append('client_secret', this.headHunterApi.HH_CLIENT_SECRET);
      params.append('redirect_uri', this.headHunterApi.REDIRECT_URI);
      params.append('code', query.code);
      const res = await this.headHunterApi.post<object, HeadHunterAuthData>(
        '/token',
        params,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      );

      const now = new Date();
      // Save tokens in redis
      const resUpdateTokens = await Promise.all([
        this.redisService.set<HeadHunterAuthTokens>(
          REDIS_KEYS.HEADHUNTER_AUTH_DATA,
          {
            ...res,
            expires: now.setDate(now.getDate() + 14),
          },
          res.expires_in,
        ),
        this.tokensService.updateToken(TokensServices.HH, {
          accessToken: res.access_token,
          refreshToken: res.refresh_token,
          expires: new Date().getTime() + res.expires_in * 1000,
        }),
      ]);

      console.log(resUpdateTokens);

      // update token on url
      this.headHunterApi.updateToken().then((res) => console.log(res));

      this.bitrixImBotService.sendMessage({
        DIALOG_ID: this.bitrixService.TEST_CHAT_ID,
        MESSAGE:
          '[user=376]Денис Некрасов[/user][br]' +
          'HH ru отправил запрос на /redirect_uri[br]' +
          JSON.stringify(fields) +
          '[br]' +
          JSON.stringify(query) +
          '[br]Ответ авторизации: ' +
          JSON.stringify(res),
      });

      return '<h1>Успех</h1><script>window.close();</script>';
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

  /**
   * Receive incoming webhook from hh.ru and distribute to functions
   *
   * ---
   *
   * Принимает исходящий вебхук от hh.ru и в зависимости от события распределяет на соответствующие функции
   * @param body
   */
  async receiveWebhook(body: HeadhunterWebhookCallDto) {
    const { id: notificationId } = body;

    // Проверяем, был ли отправлен запрос ранее
    const redisNotificationKey =
      REDIS_KEYS.HEADHUNTER_WEBHOOK_NOTIFICATION + notificationId;

    let notificationWasReceived: string | null;

    try {
      notificationWasReceived =
        await this.redisService.get<string>(redisNotificationKey);
    } catch (error) {
      throw new InternalServerErrorException(error);
    }

    if (notificationWasReceived)
      throw new ConflictException('Notification was received');

    this.redisService
      .set<string>(redisNotificationKey, notificationId, 3600)
      .catch(() => {});

    this.queueHeavyService.addTaskToHandleReceiveNewRequestFromHH(body);
    return true;
  }

  /**
   * Receive request on vacancy or invite from employer
   *
   * ---
   *
   * Обрабатывает отклик на вакансию или приглашение от работодателя
   * @param body
   */
  async handleNewResponseVacancyWebhook({
    action_type,
    payload,
  }: HeadhunterWebhookCallDto): Promise<HeadhunterWebhookCallResponse> {
    switch (action_type) {
      case HH_WEBHOOK_EVENTS.NEW_RESPONSE_OR_INVITATION_VACANCY:
        const dto = await validateField(
          HeadHunterWebhookNegotiationOrRequestPayloadDto,
          payload,
        );

        return this.handleDealHRFromHeadhunterRequest({
          resumeId: dto.resume_id,
          vacancyId: dto.vacancy_id,
          topicId: dto.topic_id,
          messageType: 'manager',
        });

      case HH_WEBHOOK_EVENTS.NEGOTIATION_EMPLOYER_STATE_CHANGE:
        const payloadDto = await validateField(
          HeadhunterWebhookNegotiationEmployerStateChangePayloadDto,
          payload,
        );

        return this.handleDealHRFromHeadhunterRequest({
          resumeId: payloadDto.resume_id,
          vacancyId: payloadDto.vacancy_id,
          topicId: payloadDto.topic_id,
          messageType:
            payloadDto.from_state === 'consider' &&
            payloadDto.to_state === 'phone_interview'
              ? 'bot'
              : 'manager',
        });

      default:
        return {
          status: false,
          message: 'Unhandled event',
        };
    }
  }

  /**
   * Find or create deal and send message in chat
   *
   * ---
   *
   * Ищет или создает сделку и отправляет сообщение в чат
   *
   * @param body
   */
  async handleDealHRFromHeadhunterRequest(
    body: HeadhunterHandleDealHROptions,
  ): Promise<HeadhunterWebhookCallResponse> {
    const { resumeId, vacancyId, topicId, messageType = 'manager' } = body;
    try {
      // Делаем запрос на получения вакансии, резюме и приглашения/отклика
      const [vacancy, resume, negotiation] = await Promise.all<
        [
          Promise<HHVacancyInterface>,
          Promise<HHResumeInterface>,
          Promise<HHNegotiationInterface | null>,
        ]
      >([
        this.headHunterRestService.getVacancyById(vacancyId),
        this.headHunterRestService.getResumeById(resumeId),
        this.headHunterRestService.getNegotiationsById(topicId),
      ]);

      const resumeWasReceived = await this.redisService.get<string>(
        REDIS_KEYS.HEADHUNTER_DATA_RESUME_ACTIVITY +
          `phone_interview:${resumeId}`,
      );

      if (resumeWasReceived && messageType !== 'bot')
        return {
          status: false,
          message: 'Event was received when state change',
        };

      let responseType = `${B24Emoji.HR.HEADHUNTER.RESPONSE}[b]Отклик[/b]`; // Начало сообщения
      let bitrixSearchTypeField = '6600'; // Тип поиска: Отклик на HH

      if (negotiation) {
        switch (negotiation.employer_state.id) {
          // Стадия: Первичный контакт
          case 'phone_interview':
            responseType = `${B24Emoji.HR.HEADHUNTER.INVITE}[b]Холодка[/b]`;
            bitrixSearchTypeField = '6598'; // Тип поиска: Холодный поиск

            if (messageType === 'bot') {
              bitrixSearchTypeField = '12008'; // Холодный поиск (Бот HH);
              responseType = `${B24Emoji.HR.HEADHUNTER.BOT}[b]Бот HH[/b]`;

              this.redisService.set<string>(
                REDIS_KEYS.HEADHUNTER_DATA_RESUME_ACTIVITY +
                  `phone_interview:${resumeId}`,
                resumeId,
                600,
              );
            }
            break;

          // Отклик
          case 'response':
            break;

          // Все другие статусы игнорировать
          default:
            return {
              status: false,
              message:
                'Stop script, cause state is not response or phone_interview',
            };
        }
      }

      // Формируем ФИО
      const candidateName = `${resume.last_name?.trim() ?? ''} ${resume.first_name ? resume.first_name?.trim() : ''}`;
      const candidateFullName = `${candidateName} ${resume?.middle_name ? resume.middle_name?.trim() : ''}`;

      // Получаем ответственного за кандидата по email
      const { result: resultGetUser } = await this.bitrixUserService.getUsers({
        filter: {
          EMAIL: vacancy.contacts.email,
        },
      });

      const bitrixUser =
        resultGetUser && resultGetUser?.length !== 0 ? resultGetUser[0] : null;

      // Формируем сообщение
      let message =
        (bitrixUser
          ? `[USER=${bitrixUser.ID}]${bitrixUser.NAME} ${bitrixUser.LAST_NAME}[/USER][br]`
          : '') +
        `${responseType} на вакансию ${vacancy.name}[br]` +
        `Кандидат: ${candidateFullName}[br]` +
        `Резюме: ${resume.alternate_url}[br][br]`;

      // Инициализируем батч запрос для поиска дублей по сделкам HR
      const selectFieldsFindDuplicateDeals = [
        'ID',
        'TITLE',
        'UF_CRM_1638524259',
        'STAGE_ID',
      ];
      const batchCommands: B24BatchCommands = {
        get_deal_by_name: {
          method: 'crm.deal.list',
          params: {
            filter: {
              CATEGORY_ID: '14',
              '%TITLE': candidateName.trim(),
            },
            select: selectFieldsFindDuplicateDeals,
          },
        },
      };

      let filterPhones: string[] = [];
      let phone = '';
      let telegram = '';
      let email = '';
      let bitrixVacancy = '';

      try {
        const vacancy = await this.getRatioVacancyBitrix(vacancyId);

        if (vacancy.bitrixField) bitrixVacancy = vacancy.bitrixField.ID;
      } catch (e) {
        bitrixVacancy = '';
      }

      // Если контакты не скрыты, формируем запрос на поиск кандидата по номеру телефона
      if (Array.isArray(resume.contact) && resume.contact?.length !== 0) {
        const candidateContacts = resume.contact.reduce(
          (acc, { kind, contact_value, value }) => {
            switch (kind) {
              case 'phone':
                if (
                  contact_value &&
                  !/[()]/.test(contact_value) &&
                  (value as ContactPhone)?.city
                ) {
                  acc[kind] = contact_value.replace(
                    ` ${value.city} `,
                    ` (${value.city}) `,
                  );
                } else {
                  acc[kind] = contact_value;
                }

                break;

              case 'email':
                acc[kind] = contact_value;
                break;
            }

            return acc;
          },
          {} as CandidateContactInterface,
        );

        phone = candidateContacts.phone ?? '';
        telegram = candidateContacts.telegram ?? '';
        email = candidateContacts.email ?? '';

        // Так как битрикс не дает апи и не форматирует номера телефонов,
        // придется в ручную формировать все варианты номеров телефоном
        filterPhones = [
          phone,
          phone.replace(/[()]/gim, ''),
          phone.replace(/-/gim, ' '),
          phone.replace(/[-()]/gim, ''),
          phone.replace(/[ \-()]/gim, ''),
        ];

        if (phone[0] == '8') {
          filterPhones.push(
            candidateContacts.phone.replace('8 ', '+7 '),
            candidateContacts.phone.replace('8 ', '+7 ').replace(/[()]/gim, ''),
            candidateContacts.phone.replace('8 ', '+7 ').replace(/-/gim, ' '),
            candidateContacts.phone
              .replace('8 ', '+7 ')
              .replace(/[-()]/gim, ''),
            candidateContacts.phone
              .replace('8 ', '+7 ')
              .replace(/[ \-()]/gim, ''),
          );
        }

        // Формируем запрос на получение дублей по номеру телефона
        batchCommands['get_deal_by_phone'] = {
          method: 'crm.deal.list',
          params: {
            filter: {
              CATEGORY_ID: '14',
              '@UF_CRM_1638524259': filterPhones,
            },
            select: selectFieldsFindDuplicateDeals,
          },
        };
      }

      // Делаем запрос на получение дублей
      const { result: batchResponse } = await this.bitrixService.callBatch<
        B24BatchResponseMap<{
          get_deal_by_name: B24Deal[];
          get_deal_by_phone?: B24Deal[];
        }>
      >(batchCommands, false);

      const {
        get_deal_by_phone: dealsByPhone = [],
        get_deal_by_name: dealsByName = [],
      } = batchResponse.result;

      const batchCommandsUpdateDealAndSendMessage: B24BatchCommands = {};

      if (dealsByPhone && dealsByPhone?.length > 0) {
        // Сначала ищем по телефону
        message +=
          'Совпадение со сделкой: ' +
          dealsByPhone.reduce((acc, { ID: dealId }) => {
            acc += this.bitrixService.generateDealUrl(dealId) + '[br]';
            return acc;
          }, '') +
          '[b]ЗАПЛАНИРУЙ ЗВОНОК[/b]';

        dealsByPhone.forEach(({ ID, STAGE_ID }) => {
          // Если сделка в неактивной стадии выходим
          if (B24DealHRRejectedStages.includes(STAGE_ID)) return;

          batchCommandsUpdateDealAndSendMessage[`update_deal=${ID}`] = {
            method: 'crm.deal.update',
            params: {
              id: ID,
              fields: {
                UF_CRM_1644922120: bitrixSearchTypeField, // Тип поиска
                ASSIGNED_BY_ID: bitrixUser?.ID,
                UF_CRM_1638524000: bitrixVacancy, // Вакансия
                STAGE_ID: 'C14:NEW', // Стадия сделки: Звонок
              },
            },
          };
        });
      } else if (dealsByName.length > 0) {
        // Сначала ищем по ФИО и телефону
        const dealsFindByPhone = dealsByName.filter((deal) => {
          return !!filterPhones.find(
            (phone) => phone == deal['UF_CRM_1638524259'],
          );
        });

        // Если не нашли по номеру
        if (dealsFindByPhone.length === 0) {
          message +=
            `${new Array(3).fill(B24Emoji.HR.HEADHUNTER.ATTENTION).join('')}[b]Найдены дубли по ФИО: [/b][br]` +
            dealsByName.reduce((acc, { ID: dealId }) => {
              acc += this.bitrixService.generateDealUrl(dealId) + '[br]';
              return acc;
            }, '');
        } else {
          message +=
            '[b]Совпадение со сделкой: [/b][br]' +
            dealsFindByPhone.reduce((acc, { ID: dealId }) => {
              acc += this.bitrixService.generateDealUrl(dealId) + '[br]';
              return acc;
            }, '') +
            '[b]ЗАПЛАНИРУЙ ЗВОНОК![/b]';

          // Обновляем найденные лиды
          dealsFindByPhone.forEach(({ ID, STAGE_ID }) => {
            // Если сделка в неактивной стадии выходим
            if (B24DealHRRejectedStages.includes(STAGE_ID)) return;

            batchCommandsUpdateDealAndSendMessage[`update_deal=${ID}`] = {
              method: 'crm.deal.update',
              params: {
                id: ID,
                fields: {
                  UF_CRM_1644922120: bitrixSearchTypeField, // Тип поиска
                  ASSIGNED_BY_ID: bitrixUser?.ID,
                  UF_CRM_1638524000: bitrixVacancy, // Вакансия
                  STAGE_ID: 'C14:NEW', // Стадия сделки: Звонок
                },
              },
            };
          });
        }
      } else {
        // Если вообще не нашли дублей - создаем новую сделку
        const { result: newDealId } = await this.bitrixDealService.createDeal({
          TITLE: candidateFullName,
          UF_CRM_1644922120: bitrixSearchTypeField, // Тип поиска
          UF_CRM_1638524259: phone, // Номер телефона
          UF_CRM_1760598515308: telegram, // Телеграмм
          UF_CRM_1638524275: email, // E-mail
          UF_CRM_1638524306: resume.alternate_url, // Ссылка на резюме
          ASSIGNED_BY_ID: bitrixUser?.ID || '',
          CATEGORY_ID: '14',
          STAGE_ID: 'C14:NEW',
          UF_CRM_1638524000: bitrixVacancy, // Вакансия
        });

        newDealId
          ? (message +=
              '[b]Создана сделка:[/b][br]' +
              this.bitrixService.generateDealUrl(newDealId))
          : (message =
              'Сделки не найдено.[br]Что то пошло не так при создании сделки');
      }

      batchCommandsUpdateDealAndSendMessage['send_message_to_hr_chat'] = {
        method: 'imbot.message.add',
        params: {
          BOT_ID: this.bitrixService.BOT_ID,
          DIALOG_ID: 'chat68032',
          MESSAGE: message,
          URL_PREVIEW: 'N',
        },
      };

      this.bitrixService.callBatch(batchCommandsUpdateDealAndSendMessage);
      return {
        status: true,
        message: 'Successfully run script',
      };
    } catch (e) {
      // Обработка ошибки.
      // Отправляем в чат информацию
      let errorMessage: string;
      isAxiosError(e)
        ? (errorMessage = e.message)
        : (errorMessage = (e as Error).message);

      this.bitrixService.callBatch({
        send_message_to_hr: {
          method: 'imbot.message.add',
          params: {
            BOT_ID: this.bitrixService.BOT_ID,
            DIALOG_ID: this.headHunterRestService.HR_CHAT_ID,
            MESSAGE:
              'Ошибка обработки отклика. Необходимо обработать вручную[br]' +
              `Резюме: https://hh.ru/resume/${resumeId}[br]` +
              `Вакансия: https://vologda.hh.ru/vacancy/${vacancyId}[br]` +
              errorMessage,
            SYSTEM: 'Y',
          },
        },
        send_message: {
          method: 'imbot.message.add',
          params: {
            BOT_ID: this.bitrixService.BOT_ID,
            DIALOG_ID: this.bitrixService.TEST_CHAT_ID,
            MESSAGE:
              'Ошибка обработки отклика[br]' +
              JSON.stringify(body) +
              '[br][br]' +
              errorMessage,
          },
        },
      });
      this.logger.error(`Ошибка обработки отклика => ${JSON.stringify(body)}`);

      return {
        status: false,
        message: 'Exit script, cause cathcing error',
      };
    }
  }

  // todo: add table
  /**
   * Return ratio vacancy
   *
   * ---
   *
   * Возвращает соотношение вакансий hh.ru и поля в сделке HR вакансия
   *
   */
  async getRatioVacancies() {
    const ratioVacanciesFromCache = await this.redisService.get<
      HHBitrixVacancy[]
    >(REDIS_KEYS.BITRIX_DATA_RATIO_VACANCIES);

    const vacancies = await this.headHunterRestService.getActiveVacancies(true);

    // Сравниваем вакансии по кол-ву элементов
    if (ratioVacanciesFromCache && ratioVacanciesFromCache.length > 0) {
      const newRatioVacancies = vacancies.reduce<HHBitrixVacancy[]>(
        (acc, vacancy) => {
          const vacancyIndex = ratioVacanciesFromCache.findIndex(
            (v) => v.id === vacancy.id,
          );
          const vacancyObject: HHBitrixVacancy = {
            id: vacancy.id,
            label: vacancy.name,
            url: vacancy.alternate_url,
            bitrixField: null,
          };

          vacancyIndex !== -1
            ? acc.push({
                ...vacancyObject,
                bitrixField: ratioVacanciesFromCache[vacancyIndex].bitrixField,
              })
            : acc.push(vacancyObject);

          return acc;
        },
        [],
      );

      this.redisService.set<HHBitrixVacancy[]>(
        REDIS_KEYS.BITRIX_DATA_RATIO_VACANCIES,
        newRatioVacancies,
      );

      return newRatioVacancies;
    }

    const ratioVacancies = vacancies.reduce<HHBitrixVacancy[]>(
      (acc, { id, name, alternate_url }) => {
        acc.push({
          id: id,
          label: name,
          url: alternate_url,
          bitrixField: null,
        });
        return acc;
      },
      [],
    );

    this.redisService.set<HHBitrixVacancy[]>(
      REDIS_KEYS.BITRIX_DATA_RATIO_VACANCIES,
      ratioVacancies,
    );

    return ratioVacancies;
  }

  async setRatioVacancies(vacancies: HHBitrixVacancy[]) {
    return this.redisService.set<HHBitrixVacancy[]>(
      REDIS_KEYS.BITRIX_DATA_RATIO_VACANCIES,
      vacancies,
    );
  }

  /**
   * Try finding ratio vacancy from hh in bitrix
   * @param vacancyId
   */
  async getRatioVacancyBitrix(vacancyId: string) {
    const ratioVacanciesFromCache = await this.redisService.get<
      HHBitrixVacancy[]
    >(REDIS_KEYS.BITRIX_DATA_RATIO_VACANCIES);

    if (ratioVacanciesFromCache) {
      const findVacancy = ratioVacanciesFromCache.find(
        (v) => v.id === vacancyId,
      );

      if (!findVacancy) throw new NotFoundException('Vacancy not found');

      return findVacancy;
    }

    const findVacancy = (await this.getRatioVacancies()).find(
      (v) => v.id === vacancyId,
    );

    if (!findVacancy) throw new NotFoundException('Vacancy not found');

    return findVacancy;
  }
}
