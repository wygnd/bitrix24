import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
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
import { B24Deal } from '@/modules/bitirx/modules/deal/deal.interface';
import { BitrixUserService } from '@/modules/bitirx/modules/user/user.service';
import { BitrixDealService } from '@/modules/bitirx/modules/deal/deal.service';
import { HH_WEBHOOK_EVENTS } from '@/modules/bitirx/modules/integration/headhunter/headhunter.contstants';
import { HeadhunterRestService } from '@/modules/headhunter/headhunter-rest.service';
import { HHBitrixVacancy } from '@/modules/bitirx/modules/integration/headhunter/interfaces/headhunter-bitrix-vacancy.interface';
import { HHVacancyDto } from '@/modules/headhunter/dtos/headhunter-vacancy.dto';

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

      console.log('Check response on get tokens', res);

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
        BOT_ID: this.bitrixService.BOT_ID,
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

  async receiveWebhook(body: HeadhunterWebhookCallDto) {
    const { action_type } = body;

    switch (action_type) {
      case HH_WEBHOOK_EVENTS.NEW_RESPONSE_VACANCY:
        return this.handleNewResponseVacancyWebhook(body);
    }
  }

  async handleNewResponseVacancyWebhook(body: HeadhunterWebhookCallDto) {
    const { id: notificationId, payload } = body;

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

    try {
      await this.redisService.set<string>(
        redisNotificationKey,
        notificationId,
        3600,
      );
    } catch (error) {
      throw new InternalServerErrorException(error);
    }

    const { resume_id, vacancy_id } = payload;

    const [vacancy, resume] = await Promise.all<
      [Promise<HHVacancyInterface>, Promise<HHResumeInterface>]
    >([
      this.headHunterRestService.getVacancyById(vacancy_id),
      this.headHunterRestService.getResumeById(resume_id),
    ]);

    const candidateName = `${resume.last_name ?? ''} ${resume.first_name ?? ''} ${resume.middle_name ?? ''}`;
    const candidateContacts = resume.contact.reduce(
      (acc, { kind, contact_value, value }) => {
        switch (kind) {
          case 'phone':
            const { city } = value as ContactPhone;
            if (!/[()]/.test(contact_value)) {
              acc[kind] = contact_value.replace(` ${city} `, ` (${city}) `);
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

    const { phone, email } = candidateContacts;

    const filterPhones = [
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
        candidateContacts.phone.replace('8 ', '+7 ').replace(/[ \-()]/gim, ''),
      );
    }

    const { result: batchResponse } = await this.bitrixService.callBatch<
      B24BatchResponseMap<{
        get_deal_by_name: B24Deal[];
        get_deal_by_phone: B24Deal[];
      }>
    >(
      {
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
        get_deal_by_phone: {
          method: 'crm.deal.list',
          params: {
            filter: {
              CATEGORY_ID: '14',
              '@UF_CRM_1638524259': filterPhones,
            },
            select: ['ID', 'TITLE', 'UF_CRM_1638524259'],
          },
        },
      },
      false,
    );

    const { get_deal_by_phone: dealsByPhone, get_deal_by_name: dealsByName } =
      batchResponse.result;

    const { result: resultGetUser } = await this.bitrixUserService.getUsers({
      filter: {
        EMAIL: vacancy.contacts.email,
      },
    });

    const bitrixUser =
      resultGetUser && resultGetUser?.length !== 0 ? resultGetUser[0] : null;

    let message =
      (bitrixUser
        ? `[USER=${bitrixUser.ID}]${bitrixUser.NAME} ${bitrixUser.LAST_NAME}[/USER][br]`
        : '') +
      `Отклик на вакансию ${vacancy.name}[br]` +
      `Кандидат: ${candidateName}[br]` +
      `Резюме: ${resume.alternate_url}[br][br]`;

    if (dealsByPhone.length > 0) {
      // Снчала ищем по телефону
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
      const { result: newDealId } = await this.bitrixDealService.createDeal({
        TITLE: candidateName,
        // Тип поиска: приведи друга
        UF_CRM_1644922120: '6600',
        // Номер телефона
        UF_CRM_1638524259: phone ?? '',
        // Телеграмм
        UF_CRM_1760598515308: candidateContacts.telegram ?? '',
        //  E-mail
        UF_CRM_1638524275: email ?? '',
        //  Ссылка на резюме
        UF_CRM_1638524306: resume.alternate_url,
        ASSIGNED_BY_ID: bitrixUser?.ID || '',
        CATEGORY_ID: '14',
        STAGE_ID: 'C14:NEW',
      });

      newDealId
        ? (message +=
            '[b]Создана сделка:[/b][br]' +
            this.bitrixService.generateDealUrl(newDealId))
        : (message =
            'Сделки не найдено.[br]Что то пошло не так при создании сделки');
    }

    await this.bitrixImBotService.sendMessage({
      BOT_ID: this.bitrixService.BOT_ID,
      DIALOG_ID: 'chat68032',
      MESSAGE: message,
      URL_PREVIEW: 'N',
    });

    // const batchCommands: B24BatchCommands = {};
    // const dealObject =
    //   dealByPhone.length !== 0
    //     ? dealByPhone[0]
    //     : dealByName.length !== 0
    //       ? dealByName[0]
    //       : null;
    //
    // // todo: Wait response from bitrix support
    // // batchCommands['get_user'] = {
    // //   method: 'user.get',
    // //   params: {
    // //     filter: {
    // //       EMAIL: vacancy.contacts.email,
    // //     },
    // //   },
    // // };
    //
    // let message = '';
    // if (!dealObject) {
    //   const { result: dealId } = await this.bitrixDealService.createDeal({
    //     TITLE: candidateName,
    //     // Тип поиска: приведи друга
    //     UF_CRM_1644922120: '6600',
    //     // Номер телефона
    //     UF_CRM_1638524259: phone ?? '',
    //     // Телеграмм
    //     UF_CRM_1760598515308: candidateContacts.telegram ?? '',
    //     //  E-mail
    //     UF_CRM_1638524275: email ?? '',
    //     //  Ссылка на резюме
    //     UF_CRM_1638524306: resume.alternate_url,
    //     ASSIGNED_BY_ID: bitrixUser?.ID || '',
    //     CATEGORY_ID: '14',
    //     STAGE_ID: 'C14:NEW',
    //   });
    //
    //   message =
    //     bitrixMessageNoteUser +
    //     `Отклик на вакансию ${vacancy.name}[br]` +
    //     `ФИО: ${candidateName}[br][br]` +
    //     `Новая сделка: ${this.bitrixService.BITRIX_DOMAIN}/crm/deal/details/${dealId}/`;
    //
    //   /*
    //    batchCommands['create_deal'] = {
    //      method: 'crm.deal.add',
    //      params: {
    //        fields: {
    //          TITLE: candidateName,
    //          // Тип поиска: приведи друга
    //          UF_CRM_1644922120: '6600',
    //          // Номер телефона
    //          UF_CRM_1638524259: phone ?? '',
    //          // Телеграмм
    //          UF_CRM_1760598515308: candidateContacts.telegram ?? '',
    //          //  E-mail
    //          UF_CRM_1638524275: email ?? '',
    //          //  Ссылка на резюме
    //          UF_CRM_1638524306: resume.alternate_url,
    //          ASSIGNED_BY_ID: bitrixUser?.ID || '',
    //          CATEGORY_ID: '14',
    //          STAGE_ID: 'C14:NEW',
    //        },
    //      },
    //    };
    //
    //    batchCommands['send_message'] = {
    //      method: 'imbot.message.add',
    //      params: {
    //        BOT_ID: this.bitrixService.BOT_ID,
    //        DIALOG_ID: 'chat77152',
    //        MESSAGE:
    //          bitrixMessageNoteUser +
    //          `TEST Отклик на вакансию ${vacancy.name}[br]` +
    //          `ФИО: ${candidateName}[br]` +
    //          `Новая сделка: ${this.bitrixService.BITRIX_DOMAIN}/crm/deal/details/$result[create_deal]/`,
    //      },
    //    };
    //    */
    // } else {
    //   message =
    //     bitrixMessageNoteUser +
    //     `Отклик на вакансию ${vacancy.name}[br]` +
    //     `ФИО: ${candidateName}[br]` +
    //     '[br]Сделка существует: ' +
    //     this.bitrixService.generateDealUrl(dealObject.ID) +
    //     '[br]ЗАПЛАНИРУЙ ЗВОНОК![br]';
    //
    //   /*
    //   batchCommands['send_message'] = {
    //     method: 'imbot.message.add',
    //     params: {
    //       BOT_ID: this.bitrixService.BOT_ID,
    //       DIALOG_ID: 'chat77152', // TEST
    //       // DIALOG_ID: 'chat68032', // HH
    //       MESSAGE:
    //         bitrixMessageNoteUser +
    //         `Отклик на вакансию ${vacancy.name}[br]` +
    //         `ФИО: ${candidateName}[br]` +
    //         '[br]Сделка существует: ' +
    //         this.bitrixService.generateDealUrl(dealObject.ID) +
    //         '[br]ЗАПЛАНИРУЙ ЗВОНОК![br]',
    //     },
    //   };
    //    */
    // }
    //
    // return this.bitrixImBotService.sendMessage({
    //   BOT_ID: this.bitrixService.BOT_ID,
    //   DIALOG_ID: 'chat77152',
    //   // DIALOG_ID: 'chat68032', // HH
    //   MESSAGE: message,
    // });
    // todo: Wait bitrix support response
    // return this.bitrixService.callBatch(batchCommands);
  }

  async getRatioVacancies() {
    const ratioVacanciesFromCache = await this.redisService.get<
      HHBitrixVacancy[]
    >(REDIS_KEYS.BITRIX_DATA_RATIO_VACANCIES);

    if (ratioVacanciesFromCache) return ratioVacanciesFromCache;

    const vacancies = await this.headHunterRestService.getActiveVacancies();

    const ratioVacancies = vacancies.reduce<HHBitrixVacancy[]>(
      (acc, { id, name, alternate_url }) => {
        acc.push({
          id: id,
          label: name,
          url: alternate_url,
          items: [],
        });
        return acc;
      },
      [],
    );

    await this.redisService.set<HHBitrixVacancy[]>(
      REDIS_KEYS.BITRIX_DATA_RATIO_VACANCIES,
      ratioVacancies,
      3600,
    );

    return ratioVacancies;
  }

  async setRatioVacancies(vacancies: HHBitrixVacancy[]) {
    return this.redisService.set<HHBitrixVacancy[]>(
      REDIS_KEYS.BITRIX_DATA_RATIO_VACANCIES,
      vacancies,
      3600,
    );
  }
}
