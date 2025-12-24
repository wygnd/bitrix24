import { Injectable, InternalServerErrorException } from '@nestjs/common';
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

@Injectable()
export class BitrixPlacementService {
  private readonly logger = new WinstonLogger(
    BitrixPlacementService.name,
    'bitrix:services'.split(':'),
  );
  constructor(
    private readonly configService: ConfigService,
    private readonly bitrixImbotService: BitrixImBotService,
    private readonly bitrixService: BitrixService,
    private readonly bitrixDealService: BitrixDealService,
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
      this.logger.info(
        {
          message: 'New open widget',
          data: { query, body },
        },
        true,
      );

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
      this.logger.error(e, true);
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

      if (!response?.result) {
        this.logger.error(response, true);
        return [];
      }

      return response.result;
    } catch (e) {
      this.logger.error(e, true);
      return [];
    }
  }
}
