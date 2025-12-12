import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import {
  PlacementBindOptions,
  PlacementUnbindOptions,
} from './placement.interface';
import { BitrixService } from '@/modules/bitrix/bitrix.service';
import { PlacementUnbindDto } from '@/modules/bitrix/modules/placement/dtos/placement-unbind.dto';
import { WinstonLogger } from '@/config/winston.logger';
import {
  B24PlacementOptions,
  B24PlacementOptionsPlacementOptionsParsed,
} from '@/modules/bitrix/modules/placement/interfaces/placement.interface';
import {
  PlacementBodyRequestDto,
  PlacementQueryRequestDto,
} from '@/modules/bitrix/modules/placement/dtos/placement-request.dto';
import type { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { BitrixImBotService } from '@/modules/bitrix/modules/imbot/imbot.service';
import { BitrixDealService } from '@/modules/bitrix/modules/deal/deal.service';
import { B24Categories } from '@/modules/bitrix/bitrix.constants';
import { B24PlacementWidgetCallCardDto } from '@/modules/bitrix/modules/placement/dtos/placement-widget-call-card.dto';
import { RedisService } from '@/modules/redis/redis.service';
import { BitrixLeadService } from '@/modules/bitrix/modules/lead/services/lead.service';
import { REDIS_KEYS } from '@/modules/redis/redis.constants';
import {
  B24PlacementWidgetCallCardPlacementOptions,
  B24PlacementWidgetCallCardResponse,
} from '@/modules/bitrix/modules/placement/interfaces/placement-widget-call-card.interface';
import {
  B24LeadActiveStages,
  B24LeadConvertedStages,
  B24LeadRejectStages,
} from '@/modules/bitrix/modules/lead/constants/lead.constants';
import { B24UserCurrent } from '@/modules/bitrix/modules/user/interfaces/user-current.interface';
import { TelphinService } from '@/modules/telphin/telphin.service';
import { TelphinUserInfo } from '@/modules/tokens/interfaces/telphin-user.interface';
import { TelphinCallItem } from '@/modules/telphin/interfaces/telphin-call.interface';
import { TelphinExtensionItem } from '@/modules/telphin/interfaces/telphin-extension.interface';

@Injectable()
export class BitrixPlacementService {
  private readonly logger = new WinstonLogger(BitrixPlacementService.name);
  constructor(
    private readonly configService: ConfigService,
    private readonly bitrixImbotService: BitrixImBotService,
    private readonly bitrixService: BitrixService,
    private readonly bitrixDealService: BitrixDealService,
    private readonly redisService: RedisService,
    private readonly bitrixLeadService: BitrixLeadService,
    private readonly telphinService: TelphinService,
  ) {}

  public async testReceiveRedirectUrl(query: any, params: any, body: any) {
    this.bitrixImbotService.sendTestMessage(
      `[b]Telphin handle redirect uri[/b][br]query: ${JSON.stringify(query)}[br]params: ${JSON.stringify(params)}[br]body: ${JSON.stringify(body)}`,
    );
    return '<h1>Успех</h1>';
  }

  public async receiveOpenWidgetCRMDetailTab(
    response: Response,
    body: PlacementBodyRequestDto,
    query: PlacementQueryRequestDto,
  ) {
    try {
      this.logger.info(`New open widget: ${JSON.stringify({ query, body })}`);
      this.bitrixImbotService
        .sendMessage({
          DIALOG_ID: this.bitrixService.TEST_CHAT_ID,
          MESSAGE:
            '[b]HR виджет[/b][br]Новое открытие виджета[br][br]' +
            `Query: ${JSON.stringify(query)}[br]` +
            `Body: ${JSON.stringify(body)}`,
        })
        .then();

      const { ID }: B24PlacementOptionsPlacementOptionsParsed = JSON.parse(
        body.PLACEMENT_OPTIONS,
      );
      const { CATEGORY_ID } = await this.bitrixDealService.getDealById(ID);

      let redirectUrl = this.configService.get<string>(
        'bitrixConstants.WIDGET_REDIRECT_HR_RATIO_VACANCIES_URL',
      );

      if (!redirectUrl) throw new InternalServerErrorException();

      switch (CATEGORY_ID) {
        case B24Categories.HR:
          redirectUrl += `?member_id=${body.member_id}`;
          break;
      }

      response.redirect(301, redirectUrl);
      return true;
    } catch (e) {
      this.logger.error(e);
      return false;
    }
  }

  async bind(params: PlacementBindOptions) {
    return this.bitrixService.callMethod<PlacementBindOptions, boolean>(
      'placement.bind',
      params,
    );
  }

  async unbind(fields: PlacementUnbindDto) {
    return this.bitrixService.callMethod<
      PlacementUnbindOptions,
      { count: number }
    >('placement.unbind', fields);
  }

  public async getBindPlacementList() {
    try {
      const response = await this.bitrixService.callMethod<
        any,
        B24PlacementOptions[]
      >('placement.get');

      console.log(response);
      if (!response?.result) {
        this.logger.error(`Error: ${JSON.stringify(response)}`);
        return [];
      }

      return response.result;
    } catch (e) {
      this.logger.error(e);
      return [];
    }
  }

  public async handleOpenWidgetCallCard({
    PLACEMENT_OPTIONS,
    AUTH_ID,
  }: B24PlacementWidgetCallCardDto): Promise<B24PlacementWidgetCallCardResponse> {
    try {
      const {
        PHONE_NUMBER: phone,
        CRM_ENTITY_ID,
      }: B24PlacementWidgetCallCardPlacementOptions =
        JSON.parse(PLACEMENT_OPTIONS);

      let leadId = CRM_ENTITY_ID;
      const response: B24PlacementWidgetCallCardResponse = {
        title: '',
        description: '',
      };

      const wasCalling = await this.redisService.get<string>(
        REDIS_KEYS.BITRIX_WIDGET_CALL_CARD + phone,
      );

      if (wasCalling) throw new ConflictException('Calling was send');

      this.redisService.set<string>(
        REDIS_KEYS.BITRIX_WIDGET_CALL_CARD + phone,
        phone,
        120, // 120 sec
      );

      const [telphinUserInfo, user] = await Promise.all<
        [Promise<TelphinUserInfo | null>, Promise<B24UserCurrent | null>]
      >([
        this.telphinService.getUserInfo(),
        this.bitrixService.getUserIdByAuth(AUTH_ID),
      ]);

      if (!telphinUserInfo)
        throw new InternalServerErrorException('Invalid get info from telphin');

      if (!user) throw new UnauthorizedException('Invalid define current user');

      const { client_id: telphinClientId } = telphinUserInfo;

      const [targetCalls, extension] = await Promise.all<
        [Promise<TelphinCallItem[]>, Promise<TelphinExtensionItem | null>]
      >([
        this.telphinService.getCurrentCalls(telphinClientId),
        this.telphinService.getClientExtensionByBitrixUserId(
          telphinClientId,
          user.ID,
        ),
      ]);

      if (!extension)
        throw new BadRequestException('Extension by user bitrix id not found');

      const targetExtension = targetCalls.find(
        ({ call_flow, caller_extension: { id: extId } }) =>
          extId === extension.id && call_flow === 'IN',
      );

      if(!targetExtension) throw new BadRequestException('Extension in current calls was not found');

      if (!leadId || leadId == '0') {
        // Ищем дубликаты
        const duplicateLeads =
          await this.bitrixLeadService.getDuplicateLeadsByPhone(phone);

        // Если нет дубликатов: создаем лид
        if (duplicateLeads.length === 0) {
          const { result: leadId } = await this.bitrixLeadService.createLead({
            ASSIGNED_BY_ID: this.bitrixService.ZLATA_ZIMINA_BITRIX_ID,
            STATUS_ID: B24LeadActiveStages[0], // Новый в работе
            PHONE: [
              {
                VALUE: phone,
                VALUE_TYPE: 'WORK',
              },
            ],
          });

          if (!leadId)
            throw new BadRequestException('Ошибка при создании лида');

          response.title = 'Создание лида';
          response.description = this.bitrixService.generateLeadUrlHtml(
            leadId.toString(),
          );

          return response;
        }

        leadId = duplicateLeads[0].toString();
      }

      const lead = await this.bitrixLeadService.getLeadById(leadId);

      if (!lead || !lead.result)
        throw new BadRequestException('Lead not found.');

      const { STATUS_ID: statusId } = lead.result;

      switch (true) {
        // Если лид в активных стадиях
        case B24LeadActiveStages.includes(statusId):
        case B24LeadConvertedStages.includes(statusId):
          response.title = 'Лид в активной или завершающей стадии';
          response.description =
            'Ответить нужно сразу. Скажи клиенту, что передашь его обращение ответственному менеджеру<br/>' +
            this.bitrixService.generateLeadUrlHtml(leadId);
          break;

        // Если лид в неактивных стадиях
        case B24LeadRejectStages.includes(statusId):
          response.title = 'Лид в неактивных стадиях';
          response.description =
            'Обновление лида<br/>' +
            this.bitrixService.generateLeadUrlHtml(leadId);
          this.bitrixLeadService
            .updateLead({
              id: leadId,
              fields: {
                STATUS_ID: B24LeadActiveStages[0], // Новый в работе
                ASSIGNED_BY_ID: user.ID,
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

      return response;
    } catch (e) {
      this.logger.error(e, e?.stack, true);

      if (e instanceof ConflictException) throw e;

      return {
        title: 'Ошибка обработки звонка',
        description: e.toString(),
      };
    }
  }
}
