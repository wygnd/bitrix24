import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { HeadhunterRedirectDto } from '@/modules/bitirx/modules/integration/headhunter/dto/headhunter-redirect.dto';
import {
  HeadHunterAuthData,
  HeadHunterAuthTokens,
} from '@/modules/bitirx/modules/integration/headhunter/interfaces/headhunter-auth.interface';
import { REDIS_KEYS } from '@/modules/redis/redis.constants';
import { BitrixImBotService } from '@/modules/bitirx/modules/imbot/imbot.service';
import { HeadHunterService } from '@/modules/headhunter/headhunter.service';
import { RedisService } from '@/modules/redis/redis.service';
import { BitrixService } from '@/modules/bitirx/bitrix.service';
import { HeadhunterWebhookCallDto } from '@/modules/bitirx/modules/integration/headhunter/dto/headhunter-webhook-call.dto';
import { HHVacancyInterface } from '@/modules/headhunter/interfaces/headhunter-vacancy.interface';
import {
  ContactPhone,
  HHResumeInterface,
} from '@/modules/headhunter/interfaces/headhunter-resume.interface';
import { CandidateContactInterface } from '@/modules/bitirx/modules/integration/headhunter/interfaces/headhunter-create-deal.interface';
import { B24BatchResponseMap } from '@/modules/bitirx/interfaces/bitrix-api.interface';
import { B24Deal } from '@/modules/bitirx/modules/deal/interfaces/deal.interface';
import { BitrixUserService } from '@/modules/bitirx/modules/user/user.service';
import { BitrixDealService } from '@/modules/bitirx/modules/deal/deal.service';
import { HH_WEBHOOK_EVENTS } from '@/modules/bitirx/modules/integration/headhunter/headhunter.contstants';
import { HeadhunterRestService } from '@/modules/headhunter/headhunter-rest.service';
import { HHBitrixVacancy } from '@/modules/bitirx/modules/integration/headhunter/interfaces/headhunter-bitrix-vacancy.interface';
import { isAxiosError } from 'axios';
import { QueueHeavyService } from '@/modules/queue/queue-heavy.service';
import { HHNegotiationInterface } from '@/modules/headhunter/interfaces/headhunter-negotiation.interface';
import { B24BatchCommands } from '@/modules/bitirx/interfaces/bitrix.interface';

@Injectable()
export class BitrixHeadHunterService {
  constructor(
    private readonly bitrixImBotService: BitrixImBotService,
    private readonly headHunterApi: HeadHunterService,
    private readonly redisService: RedisService,
    private readonly bitrixService: BitrixService,
    private readonly bitrixUserService: BitrixUserService,
    private readonly bitrixDealService: BitrixDealService,
    private readonly headHunterRestService: HeadhunterRestService,
    private readonly queueHeavyService: QueueHeavyService,
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
      await this.redisService.set<HeadHunterAuthTokens>(
        REDIS_KEYS.HEADHUNTER_AUTH_DATA,
        {
          ...res,
          expires: now.setDate(now.getDate() + 14),
        },
        1209600,
      );

      // update token on url
      await this.headHunterApi.updateToken();

      await this.bitrixImBotService.sendMessage({
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
    const { action_type } = body;

    switch (action_type) {
      case HH_WEBHOOK_EVENTS.NEW_RESPONSE_OR_INVITATION_VACANCY:
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

        // Если не было запроса, ставим задачу на обработку отклика
        this.queueHeavyService.addTaskToHandleReceiveNewResponseOrNegotiation(
          body,
        );
        return true;
    }

    return false;
  }

  /**
   * Receive request on vacancy or invite from employer
   *
   * ---
   *
   * Обрабатывает отклик на вакансию или приглашение от работодателя
   * @param body
   */
  async handleNewResponseVacancyWebhook(body: HeadhunterWebhookCallDto) {
    try {
      const { resume_id, vacancy_id, topic_id } = body.payload;

      // Делаем запрос на получения вакансии, резюме и приглашения/отклика
      const [vacancy, resume, negotiation] = await Promise.all<
        [
          Promise<HHVacancyInterface>,
          Promise<HHResumeInterface>,
          Promise<HHNegotiationInterface | null>,
        ]
      >([
        this.headHunterRestService.getVacancyById(vacancy_id),
        this.headHunterRestService.getResumeById(resume_id),
        this.headHunterRestService.getNegotiationsById(topic_id),
      ]);

      let responseType = 'Отклик';
      let bitrixSearchTypeField = '6600'; // Тип поиска: Отклик на HH

      if (negotiation) {
        switch (negotiation.employer_state.id) {
          // Стадия: Первичный контакт
          case 'phone_interview':
            responseType = 'Холодка';
            bitrixSearchTypeField = '6598'; // Тип поиска: Холодный поиск
            break;

          // Стадия: Подумать
          case 'consider':
            return false;
        }
      }

      // Формируем ФИО
      const candidateName = `${resume.last_name?.trim() ?? ''} ${resume.first_name ? resume.first_name?.trim() : ''} ${resume.middle_name ? resume.middle_name?.trim() : ''}`;

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
        `Кандидат: ${candidateName}[br]` +
        `Резюме: ${resume.alternate_url}[br][br]`;

      // Инициализируем батч запрос для поиска дублей по сделкам HR
      const batchCommands: B24BatchCommands = {
        get_deal_by_name: {
          method: 'crm.deal.list',
          params: {
            filter: {
              CATEGORY_ID: '14',
              '%TITLE': candidateName.trim(),
            },
            select: ['ID', 'TITLE', 'UF_CRM_1638524259'],
          },
        },
      };

      let filterPhones: string[] = [];
      let phone = '';
      let telegram = '';
      let email = '';

      console.log('Check contact', resume.contact);

      // Если контакты не скрыты, формируем запрос на поиск кандидата по номеру телефона
      if (Array.isArray(resume.contact) && resume.contact?.length !== 0) {
        const candidateContacts = resume.contact.reduce(
          (acc, { kind, contact_value, value }) => {
            switch (kind) {
              case 'phone':
                if (
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

        phone = candidateContacts.phone;
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
            select: ['ID', 'TITLE', 'UF_CRM_1638524259'],
          },
        };
      }

      // Делаем запрос на получение дублей
      const { result: batchResponse } = await this.bitrixService.callBatch<
        B24BatchResponseMap<{
          get_deal_by_name: B24Deal[];
          get_deal_by_phone?: B24Deal[];
        }>
      >({}, false);

      const {
        get_deal_by_phone: dealsByPhone = [],
        get_deal_by_name: dealsByName,
      } = batchResponse.result;

      console.log('Check deals: ', dealsByPhone?.length);

      if (dealsByPhone && dealsByPhone?.length > 0) {
        // Сначала ищем по телефону
        message +=
          'Совпадение со сделкой: ' +
          dealsByPhone.reduce((acc, { ID: dealId }) => {
            acc += this.bitrixService.generateDealUrl(dealId) + '[br]';
            return acc;
          }, '') +
          'ЗАПЛАНИРУЙ ЗВОНОК';
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
            '[b]Найдены дубли по ФИО: [/b][br]' +
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
            'ЗАПЛАНИРУЙ ЗВОНОК!';
        }
      } else {
        // Если вообще не нашли дублей - создаем новую сделку
        let bitrixVacancy = '';

        try {
          const vacancy = await this.getRatioVacancyBitrix(vacancy_id);

          if (vacancy.bitrixField) bitrixVacancy = vacancy.bitrixField.ID;
        } catch (e) {
          bitrixVacancy = '';
        }

        const { result: newDealId } = await this.bitrixDealService.createDeal({
          TITLE: candidateName,
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

      this.bitrixImBotService.sendMessage({
        DIALOG_ID: 'chat68032',
        MESSAGE: message,
        URL_PREVIEW: 'N',
      });
      return true;
    } catch (e) {
      console.log(e);
      // Обработка ошибки.
      // Отправляем в чат информацию
      let errorMessage = '';
      isAxiosError(e)
        ? (errorMessage = e.message)
        : (errorMessage = (e as Error).message);

      try {
        errorMessage += '[br][br]' + JSON.parse(e.response);
      } catch (err) {}

      this.bitrixService.callBatch({
        send_message_to_hr: {
          method: 'imbot.message.add',
          params: {
            BOT_ID: this.bitrixService.BOT_ID,
            DIALOG_ID: this.headHunterRestService.HR_CHAT_ID,
            MESSAGE:
              'Ошибка обработки отклика. Необходимо обработать вручную[br]' +
              `Резюме: https://hh.ru/resume/${body.payload.resume_id}[br]` +
              `Вакансия: https://vologda.hh.ru/vacancy/${body.payload.vacancy_id}[br]` +
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

      return false;
    }
  }

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
    if (ratioVacanciesFromCache) {
      const newRatioVacancies = vacancies.reduce<HHBitrixVacancy[]>(
        (acc, vacancy) => {
          const vacancyIndex = ratioVacanciesFromCache.findIndex(
            (v) => v.id === vacancy.id,
          );
          vacancyIndex !== -1
            ? acc.push(ratioVacanciesFromCache[vacancyIndex])
            : acc.push({
                id: vacancy.id,
                label: vacancy.name,
                url: vacancy.alternate_url,
                bitrixField: null,
              });
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
