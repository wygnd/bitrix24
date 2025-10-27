import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  InternalServerErrorException,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  B24ApiTags,
  B24BatchResponseMap,
} from '@/modules/bitirx/interfaces/bitrix-api.interface';
import { ConfigService } from '@nestjs/config';
import { BitrixImBotService } from '@/modules/bitirx/modules/imbot/imbot.service';
import { HeadHunterService } from '@/modules/headhunter/headhunter.service';
import { HeadhunterRedirectDto } from '@/modules/bitirx/modules/integration/headhunter/dto/headhunter-redirect.dto';
import { HeadhunterWebhookCallDto } from '@/modules/bitirx/modules/integration/headhunter/dto/headhunter-webhook-call.dto';
import { HHVacancyInterface } from '@/modules/headhunter/interfaces/headhunter-vacancy.interface';
import {
  ContactPhone,
  HHResumeInterface,
} from '@/modules/headhunter/interfaces/headhunter-resume.interface';
import { CandidateContactInterface } from '@/modules/bitirx/modules/integration/headhunter/interfaces/headhunter-create-deal.interface';
import { BitrixService } from '@/modules/bitirx/bitrix.service';
import { B24Deal } from '@/modules/bitirx/modules/deal/deal.interface';
import { B24BatchCommands } from '@/modules/bitirx/interfaces/bitrix.interface';
import { B24User } from '@/modules/bitirx/modules/user/user.interface';
import { B24ImSendMessage } from '@/modules/bitirx/modules/im/interfaces/im.interface';
import { AbstractB24 } from '@bitrix24/b24jssdk';
import { AxiosError, isAxiosError } from 'axios';
import { BitrixUserService } from '@/modules/bitirx/modules/user/user.service';
import { BitrixDealService } from '@/modules/bitirx/modules/deal/deal.service';

@ApiTags(B24ApiTags.HEAD_HUNTER)
@Controller('integration/headhunter')
export class BitrixHeadHunterController {
  constructor(
    private readonly bitrixImBotService: BitrixImBotService,
    private readonly configService: ConfigService,
    private readonly headHunterApi: HeadHunterService,
    private readonly bitrixService: BitrixService,
    private readonly bitrixUserService: BitrixUserService,
    private readonly bitrixDealService: BitrixDealService,
  ) {}

  @ApiOperation({ summary: 'Handle hh.ru application' })
  @Get('/redirect_uri')
  @HttpCode(HttpStatus.OK)
  async handleApp(@Body() fields: any, @Query() query: HeadhunterRedirectDto) {
    const params = new URLSearchParams();
    params.append('grant_type', 'authorization_code');
    params.append('client_id', this.headHunterApi.HH_CLIENT_ID);
    params.append('client_secret', this.headHunterApi.HH_CLIENT_SECRET);
    params.append('code', query.code);
    const res = await this.headHunterApi.post('/token', params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    await this.bitrixImBotService.sendMessage({
      BOT_ID: this.bitrixService.BOT_ID,
      DIALOG_ID:
        this.configService.get<string>('bitrixConstants.TEST_CHAT_ID') ?? '376',
      MESSAGE:
        '[user=376]Денис Некрасов[/user][br]' +
        'HH ru отправил заапрос на /redirect_uri[br]' +
        JSON.stringify(fields) +
        '[br]' +
        JSON.stringify(query) +
        '[br]Ответ авторизации: ' +
        JSON.stringify(res),
    });
    return true;
  }

  @HttpCode(HttpStatus.OK)
  @Post('/webhook')
  async receiveWebhook(@Body() body: HeadhunterWebhookCallDto) {
    try {
      await this.bitrixImBotService.sendMessage({
        BOT_ID: this.bitrixService.BOT_ID,
        DIALOG_ID: 'chat77152',
        MESSAGE:
          '[b]hh.ru[/b][br][user=376]Денис Некрасов[/user][br]Новое уведомление:[br]' +
          JSON.stringify(body),
      });

      const { resume_id, vacancy_id } = body.payload;

      const [vacancy, resume] = await Promise.all<
        [Promise<HHVacancyInterface>, Promise<HHResumeInterface>]
      >([
        this.headHunterApi.getVacancyById(vacancy_id),
        this.headHunterApi.getResumeById(resume_id),
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
        phone.replace(/[ -()]/gim, ''),
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

      console.log(filterPhones);

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
                '%TITLE': candidateName,
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

      console.log('Candidate: ', candidateName);

      let message =
        (bitrixUser
          ? `[USER=${bitrixUser.ID}]${bitrixUser.NAME} ${bitrixUser.LAST_NAME}[/USER][br]`
          : '') +
        `Отклик на вакансию ${vacancy.name}[br]` +
        `Кандидат: ${candidateName}[br]`;

      if (dealsByName.length > 0) {
        // Сначала ищем по ФИО и телефону
        const dealsFindByPhone = dealsByName.filter((deal) => {
          return !!filterPhones.find(
            (phone) => phone == deal['UF_CRM_1638524259'],
          );
        });

        if (dealsFindByPhone.length === 0) {
          message +=
            '[br][b]Найдены дубли по ФИО: [/b][br]' +
            dealsByName.reduce((acc, { ID: dealId }) => {
              acc += this.bitrixService.generateDealUrl(dealId) + '[br]';
              return acc;
            }, '');
        } else {
          message +=
            '[b]Совпадение со сделкой: [/b]' +
            dealsFindByPhone.reduce((acc, { ID: dealId }) => {
              acc += this.bitrixService.generateDealUrl(dealId) + '[br]';
              return acc;
            }, '') +
            '[br]ЗАПЛАНИРУЙ ЗВОНОК!';
        }
      } else if (dealsByPhone.length > 0) {
        // Если нет по ФИО ищем по телефону

        message +=
          '[br]Совпадение со сделкой: ' +
          dealsByPhone.reduce((acc, { ID: dealId }) => {
            acc += this.bitrixService.generateDealUrl(dealId) + '[br]';
            return acc;
          }, '') +
          '[br]ЗАПЛАНИРУЙ ЗВОНОК';
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
              'Создана сделка: ' +
              this.bitrixService.generateDealUrl(newDealId))
          : (message =
              'Сделки не найдено.[br]Что то пошло не так при создании сделки');
      }

      await this.bitrixImBotService.sendMessage({
        BOT_ID: this.bitrixService.BOT_ID,
        DIALOG_ID: 'chat68032',
        MESSAGE: message,
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
    } catch (error) {
      if (isAxiosError(error)) {
        console.log('AXIOS ERROR: ', error);
        throw new InternalServerErrorException(error);
      }

      throw new HttpException(error, HttpStatus.BAD_REQUEST);
    }
  }
}
