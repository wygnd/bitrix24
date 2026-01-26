import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { WinstonLogger } from '@/config/winston.logger';
import { HeadHunterService } from '@/modules/headhunter/headhunter.service';
import { RedisService } from '@/modules/redis/redis.service';
import { HeadhunterRestService } from '@/modules/headhunter/headhunter-rest.service';
import { QueueHeavyService } from '@/modules/queue/queue-heavy.service';
import { TokensService } from '@/modules/tokens/tokens.service';
import { HeadhunterWebhookCallDto } from '@/modules/bitrix/application/dtos/headhunter/headhunter-webhook-call.dto';
import { HHVacancyInterface } from '@/modules/headhunter/interfaces/headhunter-vacancy.interface';
import {
  ContactPhone,
  HHResumeInterface,
} from '@/modules/headhunter/interfaces/headhunter-resume.interface';
import { CandidateContactInterface } from '@/modules/bitrix/application/interfaces/headhunter/headhunter-create-deal.interface';
import { B24Deal } from '@/modules/bitrix/application/interfaces/deals/deals.interface';
import { HH_WEBHOOK_EVENTS } from '@/modules/bitrix/application/constants/headhunter/headhunter.contstants';
import {
  BitrixHeadhunterUpdateVacancyAttributes,
  HHBitrixVacancyCreationalAttributes,
} from '@/modules/bitrix/application/interfaces/headhunter/headhunter-bitrix-vacancy.interface';
import { isAxiosError } from 'axios';
import { HHNegotiationInterface } from '@/modules/headhunter/interfaces/headhunter-negotiation.interface';
import { B24BatchCommands } from '@/modules/bitrix/interfaces/bitrix.interface';
import { HeadhunterHandleDealHROptions } from '@/modules/bitrix/application/interfaces/headhunter/headhunter-handle-deal-from-headhunter.interface';
import { validateField } from '@/common/validators/validate-field.validator';
import { HeadHunterWebhookNegotiationOrRequestPayloadDto } from '@/modules/bitrix/application/dtos/headhunter/headhunter-webhook-negotiation-or-request.dto';
import { HeadhunterWebhookNegotiationEmployerStateChangePayloadDto } from '@/modules/bitrix/application/dtos/headhunter/headhunter-webhook-negotiation-employer-state-change.dto';
import { HeadhunterWebhookCallResponse } from '@/modules/bitrix/application/interfaces/headhunter/headhunter-webhook-call.interface';
import { B24DealHRRejectedStages } from '@/modules/bitrix/application/constants/deal/deal-hr.constants';
import { B24Emoji, B24PORTS } from '@/modules/bitrix/bitrix.constants';
import { TokensServices } from '@/modules/tokens/interfaces/tokens-serivces.interface';
import { HeadhunterRedirectDto } from '@/modules/bitrix/application/dtos/headhunter/headhunter-redirect.dto';
import {
  HeadHunterAuthData,
  HeadHunterAuthTokens,
} from '@/modules/bitrix/application/interfaces/headhunter/headhunter-auth.interface';
import { REDIS_KEYS } from '@/modules/redis/redis.constants';
import type { BitrixBotPort } from '@/modules/bitrix/application/ports/bot/bot.port';
import type { BitrixPort } from '@/modules/bitrix/application/ports/common/bitrix.port';
import type { BitrixUsersPort } from '@/modules/bitrix/application/ports/users/users.port';
import type { BitrixDealsPort } from '@/modules/bitrix/application/ports/deals/deals.port';
import type { BitrixHeadhunterVacanciesRepositoryPort } from '@/modules/bitrix/application/ports/headhunter/headhunter-vacancies-repository.port';
import { HHBitrixVacancyDto } from '@/modules/bitrix/application/dtos/headhunter/headhunter-bitrix-vacancy.dto';
import { B24ImKeyboardOptions } from '@/modules/bitrix/application/interfaces/messages/messages.interface';
import { ImbotKeyboardApproveCreateHrDealByRequestCandidate } from '@/modules/bitrix/application/interfaces/bot/imbot-keyboard-approve-create-hr-deal-by-request-candidate.interface';
import dayjs from 'dayjs';

@Injectable()
export class BitrixHeadhunterUseCase {
  private readonly logger = new WinstonLogger(
    BitrixHeadhunterUseCase.name,
    'bitrix:headhunter'.split(':'),
  );

  constructor(
    @Inject(B24PORTS.BOT.BOT_DEFAULT)
    private readonly bitrixBot: BitrixBotPort,
    private readonly headHunterApi: HeadHunterService,
    private readonly redisService: RedisService,
    @Inject(B24PORTS.BITRIX)
    private readonly bitrixService: BitrixPort,
    @Inject(B24PORTS.USERS.USERS_DEFAULT)
    private readonly bitrixUsers: BitrixUsersPort,
    @Inject(B24PORTS.DEALS.DEALS_DEFAULT)
    private readonly bitrixDeals: BitrixDealsPort,
    private readonly headHunterRestService: HeadhunterRestService,
    private readonly queueHeavyService: QueueHeavyService,
    private readonly tokensService: TokensService,
    @Inject(B24PORTS.HEADHUNTER.HH_VACANCIES_REPOSITORY)
    private readonly headhunterVacanciesRepository: BitrixHeadhunterVacanciesRepositoryPort,
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

      this.bitrixBot.sendMessage({
        DIALOG_ID: this.bitrixService.getConstant('TEST_CHAT_ID'),
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

    this.logger.debug(body);

    this.redisService.set<string>(redisNotificationKey, notificationId, 3600);

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
    try {
      let response: Promise<HeadhunterWebhookCallResponse>;
      switch (action_type) {
        case HH_WEBHOOK_EVENTS.NEW_RESPONSE_OR_INVITATION_VACANCY:
          const dto = await validateField(
            HeadHunterWebhookNegotiationOrRequestPayloadDto,
            payload,
          );

          response = this.handleDealHRFromHeadhunterRequest({
            resumeId: dto.resume_id,
            vacancyId: dto.vacancy_id,
            topicId: dto.topic_id,
            messageType: 'manager',
          });
          break;

        case HH_WEBHOOK_EVENTS.NEGOTIATION_EMPLOYER_STATE_CHANGE:
          const payloadDto = await validateField(
            HeadhunterWebhookNegotiationEmployerStateChangePayloadDto,
            payload,
          );

          // В зависимости от того, на какую стадию перевели
          switch (payloadDto.to_state) {
            // Если стадия Вакансия закрыта
            case 'discard_vacancy_closed':
              response = this.handleRejectStatusFromHeadhunterRequest(
                payloadDto.resume_id,
                payloadDto.vacancy_id,
              );
              break;

            // В остальных случаях идем по стандартному пути
            default:
              response = this.handleDealHRFromHeadhunterRequest({
                resumeId: payloadDto.resume_id,
                vacancyId: payloadDto.vacancy_id,
                topicId: payloadDto.topic_id,
                messageType:
                  payloadDto.from_state === 'consider' &&
                  payloadDto.to_state === 'phone_interview'
                    ? 'bot'
                    : 'manager',
              });
              break;
          }
          break;

        default:
          response = Promise.resolve({
            status: false,
            message: 'Unhandled event',
          });
          break;
      }

      response.then((res) => {
        this.logger.debug({
          fields: {
            action_type,
            payload,
          },
          response: res,
        });
      });

      return response;
    } catch (error) {
      this.logger.error({
        handler: this.handleNewResponseVacancyWebhook.name,
        fields: { action_type, payload },
        error,
      });
      throw error;
    }
  }

  /**
   * Find or create deals and send message in chat
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

      let responseType = `[b]Отклик[/b]`; // Начало сообщения
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
      const resultGetUser = await this.bitrixUsers.getUsers({
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
        `Резюме: ${resume.alternate_url}`;

      let phone = '';
      let telegram = '';
      let email = '';
      let bitrixVacancy = '';

      try {
        const vacancy = await this.getRatioVacancy(vacancyId);

        if (vacancy.bitrixField) bitrixVacancy = vacancy.bitrixField.id;
      } catch (e) {
        bitrixVacancy = '';
      }

      // Если контакты не скрыты, формируем запрос на поиск кандидата по номеру телефона
      if (Array.isArray(resume.contact) && resume.contact?.length !== 0) {
        const candidateContacts = this.getCandidateContactsFromResume(resume);

        phone = candidateContacts.phone;
        telegram = candidateContacts.telegram;
        email = candidateContacts.email;
      }

      const messageKeyboardItems: B24ImKeyboardOptions[] = [];
      const batchCommandsUpdateDealAndSendMessage: B24BatchCommands = {};

      const { deals, type } = await this.findDuplicateHRDealByResume(resume);

      switch (type) {
        // Если нашли совпадения по телефону
        case 'phone':
          message =
            'Совпадение со сделкой:[br]' +
            deals.reduce((acc, { ID: dealId }) => {
              acc += this.bitrixService.generateDealUrl(dealId) + '[br]';
              return acc;
            }, '') +
            '[b]ЗАПЛАНИРУЙ ЗВОНОК[/b][br][br]' +
            message;

          deals.forEach(({ ID, STAGE_ID }) => {
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
                  UF_CRM_5F4F9B3E93B15: resume?.area.name, // Город
                  UF_CRM_1671701454: resume?.birth_date, // Дата рождения
                },
              },
            };
          });
          break;

        // Если нашли только по ФИ
        case 'name':
          message =
            `${new Array(3).fill(B24Emoji.HR.HEADHUNTER.ATTENTION).join('')}[b]Найдены дубли по ФИО: [/b][br][br]` +
            message;
          messageKeyboardItems.push(
            {
              TEXT: 'Создать сделку',
              COMMAND: 'approveCreateHRDeal',
              COMMAND_PARAMS: JSON.stringify({
                isApproved: true,
                candidateName: candidateFullName,
                searchType: bitrixSearchTypeField,
                phone: phone,
                email: email,
                telegram: telegram,
                resumeLink: resume.alternate_url,
                assignedId: bitrixUser?.ID ?? '',
                vacancy: bitrixVacancy,
                message: this.bitrixBot.encodeText(message),
                area: resume?.area.name ?? '',
                birthday: resume?.birth_date ?? '',
              } as ImbotKeyboardApproveCreateHrDealByRequestCandidate),
              DISPLAY: 'LINE',
              BLOCK: 'Y',
              BG_COLOR_TOKEN: 'primary',
            },
            {
              TEXT: 'Не создавать сделку',
              COMMAND: 'approveCreateHRDeal',
              COMMAND_PARAMS: JSON.stringify({
                isApproved: false,
                candidateName: candidateFullName,
                searchType: bitrixSearchTypeField,
                phone: phone,
                email: email,
                telegram: telegram,
                resumeLink: resume.alternate_url,
                assignedId: bitrixUser?.ID ?? '',
                vacancy: bitrixVacancy,
                message: this.bitrixBot.encodeText(message),
              } as ImbotKeyboardApproveCreateHrDealByRequestCandidate),
              DISPLAY: 'LINE',
              BLOCK: 'Y',
              BG_COLOR_TOKEN: 'alert',
            },
          );

          if (bitrixUser && bitrixUser.ID) {
            batchCommandsUpdateDealAndSendMessage[
              'send_private_message_to_assigned_vacancy'
            ] = {
              method: 'im.message.add',
              params: {
                DIALOG_ID: bitrixUser.ID,
                KEYBOARD: messageKeyboardItems,
                MESSAGE: message,
                URL_PREVIEW: 'N',
              },
            };
          }
          break;

        // Если нашли по ФИ и телефону
        case 'name_phone':
          message =
            '[b]Совпадение со сделкой: [/b][br]' +
            deals.reduce((acc, { ID: dealId }) => {
              acc += this.bitrixService.generateDealUrl(dealId) + '[br]';
              return acc;
            }, '') +
            '[b]ЗАПЛАНИРУЙ ЗВОНОК![/b][br][br]' +
            message;

          // Обновляем найденные лиды
          deals.forEach(({ ID, STAGE_ID }) => {
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
                  UF_CRM_5F4F9B3E93B15: resume?.area.name, // Город
                  UF_CRM_1671701454: resume?.birth_date, // Дата рождения
                },
              },
            };
          });
          break;

        // Если вообще не нашли дублей - создаем новую сделку
        case 'create':
          const newDealId = await this.bitrixDeals.createDeal({
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
            UF_CRM_5F4F9B3E93B15: resume?.area.name ?? '', // Город
            UF_CRM_1671701454: resume?.birth_date ?? '', // Дата рождения
          });

          newDealId
            ? (message =
                '[b]Создана сделка:[/b][br]' +
                this.bitrixService.generateDealUrl(newDealId) +
                '[br][br]' +
                message)
            : (message =
                'Сделки не найдено.[br]Что то пошло не так при создании сделки');
          break;
      }

      batchCommandsUpdateDealAndSendMessage['send_message_to_hr_chat'] = {
        method: 'imbot.message.add',
        params: {
          BOT_ID: this.bitrixService.getConstant('BOT_ID'),
          DIALOG_ID: 'chat68032',
          MESSAGE: message,
          URL_PREVIEW: 'N',
        },
      };

      this.bitrixService
        .callBatch(batchCommandsUpdateDealAndSendMessage)
        .then((res) =>
          this.logger.debug({
            fields: body,
            response: res,
          }),
        );
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

      this.bitrixBot.sendMessage({
        DIALOG_ID: this.headHunterRestService.HR_CHAT_ID,
        MESSAGE:
          'Ошибка обработки отклика. Необходимо обработать вручную[br]' +
          `Резюме: https://hh.ru/resume/${resumeId}[br]` +
          `Вакансия: https://vologda.hh.ru/vacancy/${vacancyId}[br]` +
          errorMessage,
        SYSTEM: 'Y',
      });

      this.logger.error({
        message: 'Ошибка обработки отклика',
        data: body,
      });

      return {
        status: false,
        message: 'Exit script, cause catching error',
      };
    }
  }

  /**
   * Handle resume which change state to discard_vacancy_closed
   *
   * ---
   *
   * Обработка резюме, которое перешло в стадию "Вакансия закрыта"
   * @param resumeId
   * @param vacancyId
   */
  async handleRejectStatusFromHeadhunterRequest(
    resumeId: string,
    vacancyId: string,
  ): Promise<HeadhunterWebhookCallResponse> {
    try {
      const resume = await this.headHunterRestService.getResumeById(resumeId);

      const { deals, type } = await this.findDuplicateHRDealByResume(resume);

      if (type !== 'phone')
        return {
          status: false,
          message: 'Not handled',
        };

      const [deal] = deals;
      const comment = `${dayjs().format('DD.MM.YYYY')} отказ с нашей стороны - неподходящий возраст${resume?.age ? ' - ' + resume.age : ''}`;

      Promise.all([
        // Получаем последний звонок, закрываем его
        // Обновляем сделку
        // Добавляем коментраий к сделке
        this.bitrixService.callBatch({
          get_deal_calls: {
            method: 'crm.activity.list',
            params: {
              filter: {
                OWNER_ID: deal.ID,
                PROVIDER_TYPE_ID: 'CALL',
                COMPLETED: 'N',
              },
              select: ['ID', 'OWNER_TYPE_ID', 'OWNER_ID', 'TYPE_ID'],
            },
          },
          update_activity: {
            method: 'crm.activity.update',
            params: {
              id: '$result[get_deal_calls][0][ID]',
              fields: {
                TYPE_ID: '$result[get_deal_calls][0][TYPE_ID]',
                OWNER_TYPE_ID: '$result[get_deal_calls][0][OWNER_TYPE_ID]',
                OWNER_ID: '$result[get_deal_calls][0][OWNER_ID]',
                COMPLETED: 'Y',
              },
            },
          },
          update_deal: {
            method: 'crm.deal.update',
            params: {
              id: deal.ID,
              fields: {
                STAGE_ID: 'C14:PREPAYMENT_INVOIC', // Стадия: Мы отказали
                UF_CRM_1657280095: '8324', // Причина отказа с нашей стороны: Неподходящий возраст
              },
            },
          },
          add_deal_comment: {
            method: 'crm.timeline.comment.add',
            params: {
              fields: {
                ENTITY_ID: deal.ID,
                ENTITY_TYPE: 'deal',
                AUTHOR_ID: deal.ASSIGNED_BY_ID,
                COMMENT: comment,
              },
            },
          },
        }),

        // Добавить комментарий к соискателю
        this.headHunterRestService.addCandidateComment(
          resume.owner.id,
          comment,
          'coworkers',
        ),
      ]);

      return {
        status: false,
        message: 'Not implemented',
      };
    } catch (error) {
      this.bitrixBot.sendMessage({
        DIALOG_ID: this.headHunterRestService.HR_CHAT_ID,
        MESSAGE:
          '[b]Ошибка обработки перевода резюме в стадию Вакансия закрыта[/b][br]' +
          `Резюме: https://hh.ru/resume/${resumeId}[br]` +
          `Вакансия: https://vologda.hh.ru/vacancy/${vacancyId}[br]`,
        SYSTEM: 'Y',
      });

      this.logger.error({
        fields: resumeId,
        error,
      });
      return {
        status: false,
        message: 'Throw error',
      };
    }
  }

  /**
   * Trying find duplicate HR deals by candidate resume
   *
   * ---
   *
   * Поиск дубликатов HR сделок по резюме кандидата
   * @param resume
   * @private
   */
  private async findDuplicateHRDealByResume(resume: HHResumeInterface) {
    const candidateName = `${resume.last_name?.trim() ?? ''} ${resume.first_name ? resume.first_name?.trim() : ''}`;
    let filterPhones: string[] = [];
    let phone: string;

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

    if (Array.isArray(resume.contact) && resume.contact?.length !== 0) {
      const candidateContacts = this.getCandidateContactsFromResume(resume);

      phone = candidateContacts.phone ?? '';

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
          candidateContacts.phone.replace('8 ', '+7 ').replace(/[-()]/gim, ''),
          candidateContacts.phone
            .replace('8 ', '+7 ')
            .replace(/[ \-()]/gim, ''),
        );
      }

      filterPhones = filterPhones.reduce<string[]>((acc, phone) => {
        acc.push(` ${phone}`);
        acc.push(`${phone} `);
        acc.push(phone);
        return acc;
      }, []);

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

    const { result: batchResponse } = await this.bitrixService.callBatch<{
      get_deal_by_name: B24Deal[];
      get_deal_by_phone?: B24Deal[];
    }>(batchCommands, false);

    const {
      get_deal_by_phone: dealsByPhone = [],
      get_deal_by_name: dealsByName = [],
    } = batchResponse.result;

    let deals: B24Deal[];
    let type: 'phone' | 'name' | 'create' | 'name_phone';

    // Сначала ищем по номеру телефона
    if (dealsByPhone && dealsByPhone.length > 0) {
      deals = dealsByPhone;
      type = 'phone';
    } else if (dealsByName.length > 0) {
      // Далее ищем по ФИО и телефону
      const dealsFindByPhone = dealsByName.filter((deal) => {
        return !!filterPhones.find(
          (phone) => phone == deal['UF_CRM_1638524259'],
        );
      });

      // Если не нашли по номеру
      if (dealsFindByPhone.length === 0) {
        deals = dealsByName;
        type = 'name';
      } else {
        deals = dealsFindByPhone;
        type = 'name_phone';
      }
    } else {
      //  Если вообще не нашли дублей - создаем новую сделку
      deals = [];
      type = 'create';
    }

    return {
      deals,
      type,
    };
  }

  /**
   * Get contacts from candidate resume
   *
   * ---
   *
   * Получает контакты из резюме кандидата
   * @param resume
   * @private
   */
  private getCandidateContactsFromResume(
    resume: HHResumeInterface,
  ): CandidateContactInterface {
    if (!Array.isArray(resume.contact) || resume.contact?.length === 0) {
      return {
        phone: '',
        email: '',
        telegram: '',
      };
    }

    return resume.contact.reduce((acc, { kind, contact_value, value }) => {
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
    }, {} as CandidateContactInterface);
  }

  async getVacancies(): Promise<HHBitrixVacancyDto[]> {
    const [vacanciesDB, vacanciesHH] = await Promise.all([
      this.headhunterVacanciesRepository.getVacancies({
        order: [['id', 'asc']],
      }),
      this.headHunterRestService.getActiveVacancies(true),
    ]);
    const createVacancies = new Set<HHBitrixVacancyCreationalAttributes>();
    const visitedVacancies = new Set<string>();
    const removeVacancies = new Set<number>();
    const trueVacancies: HHBitrixVacancyDto[] = [];

    // Проходим по активным вакансиям и сверяем их со списком из БД
    // Если не нашли в списке из БД: добавляем в список для создания
    // Если нашли: добавляем в список пройденных - нужно, чтобы потом убрать лишние из БД
    vacanciesHH.forEach(({ id, name, alternate_url }) => {
      visitedVacancies.add(id);
      const vacancyDBIndex = vacanciesDB.findIndex((v) => v.vacancyId == id);

      if (vacancyDBIndex === -1) {
        createVacancies.add({
          vacancyId: id,
          label: name,
          url: alternate_url,
          bitrixField: null,
        });
      }
    });

    // Проходим по списку из БД и ищем устаревшие вакансии
    vacanciesDB.forEach((vacancy) => {
      // Если не нашли ваканию в списке посещенных вакансий с HH: добавляем в список на удаление
      if (!visitedVacancies.has(vacancy.vacancyId)) {
        removeVacancies.add(vacancy.id);
      } else {
        trueVacancies.push(Object.assign({}, vacancy));
      }
    });

    if (createVacancies.size > 0) {
      const newDBVacancies =
        await this.headhunterVacanciesRepository.addVacancies([
          ...createVacancies,
        ]);

      // Добавляем в итоговый массив новые вакансии
      newDBVacancies.forEach((vacancy) => {
        trueVacancies.push(Object.assign({}, vacancy));
      });
    }

    if (removeVacancies.size > 0)
      this.headhunterVacanciesRepository.removeVacancy([...removeVacancies]);

    return trueVacancies;
  }

  async updateVacancies(records: BitrixHeadhunterUpdateVacancyAttributes[]) {
    return {
      status: await this.headhunterVacanciesRepository.updateVacancies(records),
    };
  }

  async updateVacancy(fields: BitrixHeadhunterUpdateVacancyAttributes) {
    return {
      status: await this.headhunterVacanciesRepository.updateVacancy(fields),
    };
  }

  async addVacancy(fields: HHBitrixVacancyCreationalAttributes) {
    const vacancy = await this.headhunterVacanciesRepository.addVacancy(fields);

    if (!vacancy) throw new BadRequestException('Invalid add vacancy');

    return vacancy;
  }

  /**
   * Try finding ratio vacancy from hh in bitrix
   * @param vacancyId
   */
  async getRatioVacancy(vacancyId: string) {
    const vacancyFromCache = await this.redisService.get<HHBitrixVacancyDto>(
      REDIS_KEYS.BITRIX_DATA_RATIO_VACANCY,
    );

    if (vacancyFromCache) return vacancyFromCache;

    const findVacancy = (await this.getVacancies()).find(
      (v) => v.vacancyId === vacancyId,
    );

    if (!findVacancy) throw new NotFoundException('Vacancy not found');

    this.redisService.set<HHBitrixVacancyDto>(
      REDIS_KEYS.BITRIX_DATA_RATIO_VACANCY,
      findVacancy,
      600, // 10 minutes
    );

    return findVacancy;
  }
}
