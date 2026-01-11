import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { B24Categories, B24PORTS } from '@/modules/bitrix/bitrix.constants';
import type { BitrixPlacementsPort } from '@/modules/bitrix/application/ports/placements/placements.port';
import {
  PlacementBodyRequestDto,
  PlacementQueryRequestDto,
} from '@/modules/bitrix/application/dtos/placements/placement-request.dto';
import {
  B24PlacementOptionsPlacementOptionsParsed,
  PlacementBindOptions,
  PlacementUnbindOptions,
} from '@/modules/bitrix/application/interfaces/placements/placement.interface';
import type { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { WinstonLogger } from '@/config/winston.logger';
import type { BitrixDealsPort } from '@/modules/bitrix/application/ports/deals/deals.port';

@Injectable()
export class BitrixPlacementsUseCase {
  private readonly logger = new WinstonLogger(
    BitrixPlacementsUseCase.name,
    'bitrix:placements'.split(':'),
  );

  constructor(
    @Inject(B24PORTS.PLACEMENTS.PLACEMENTS_DEFAULT)
    private readonly bitrixPlacements: BitrixPlacementsPort,
    private readonly configService: ConfigService,
    @Inject(B24PORTS.DEALS.DEALS_DEFAULT)
    private readonly bitrixDeals: BitrixDealsPort,
  ) {}

  async addPlacement(fields: PlacementBindOptions) {
    return this.bitrixPlacements.bind(fields);
  }

  async removePlacement(fields: PlacementUnbindOptions) {
    return this.bitrixPlacements.unbind(fields);
  }

  async getBoundPlacementList() {
    return this.bitrixPlacements.getBoundPlacementList();
  }

  public async receiveOpenWidgetCRMDetailTab(
    response: Response,
    body: PlacementBodyRequestDto,
    query: PlacementQueryRequestDto,
  ) {
    try {
      this.logger.debug(
        {
          message: 'New open widget',
          data: { query, body },
        },
        true,
      );

      const { ID }: B24PlacementOptionsPlacementOptionsParsed = JSON.parse(
        body.PLACEMENT_OPTIONS,
      );
      const deal = await this.bitrixDeals.getDealById(ID);

      if (!deal) throw new BadRequestException(`Invalid get deal by id: ${ID}`);

      let redirectUrl = this.configService.get<string>(
        'bitrixConstants.WIDGET_REDIRECT_HR_RATIO_VACANCIES_URL',
      );

      if (!redirectUrl) throw new InternalServerErrorException();

      switch (deal.CATEGORY_ID) {
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
}
