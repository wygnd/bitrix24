import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
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
import { B24PlacementWidgetCallCardPlacementOptions } from '@/modules/bitrix/modules/placement/interfaces/placement-widget-call-card.interface';
import { RedisService } from '@/modules/redis/redis.service';
import { REDIS_KEYS } from '@/modules/redis/redis.constants';
import { BitrixLeadService } from '@/modules/bitrix/modules/lead/services/lead.service';

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
  }: B24PlacementWidgetCallCardDto) {
    try {
      const {
        PHONE_NUMBER: phone,
        CRM_ENTITY_ID: leadId,
      }: B24PlacementWidgetCallCardPlacementOptions =
        JSON.parse(PLACEMENT_OPTIONS);

      const wasCalling = await this.redisService.get<string>(
        REDIS_KEYS.BITRIX_WIDGET_CALL_CARD + phone,
      );

      if (wasCalling) throw new ConflictException('Calling was send');

      this.redisService.set<string>(
        REDIS_KEYS.BITRIX_WIDGET_CALL_CARD + phone,
        phone,
        120, // 120 sec
      );

      if (!leadId) {
        // Ищем дубликаты
        const duplicateLeads =
          await this.bitrixLeadService.getDuplicateLeadsByPhone(phone);

        // Если нет дубликатов: создаем лид
        if (duplicateLeads.length === 0) {
          this.bitrixLeadService
            .createLead({
              ASSIGNED_BY_ID: this.bitrixService.ZLATA_ZIMINA_BITRIX_ID,
              PHONE: [
                {
                  VALUE: phone,
                  VALUE_TYPE: 'WORK',
                },
              ],
            })
            .catch((err) => {
              this.logger.error(`Execute error on create lead: ${err}`);
            });
        }
      }

      return true;
    } catch (e) {
      this.logger.error(e, undefined, true);
      throw e;
    }
  }
}
