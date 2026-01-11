import { Inject, Injectable } from '@nestjs/common';
import { BitrixPlacementsPort } from '@/modules/bitrix/application/ports/placements/placements.port';
import type { BitrixPort } from '@/modules/bitrix/application/ports/common/bitrix.port';
import { B24PORTS } from '@/modules/bitrix/bitrix.constants';
import { PlacementUnbindDto } from '@/modules/bitrix/application/dtos/placements/placement-unbind.dto';
import { WinstonLogger } from '@/config/winston.logger';
import {
  B24PlacementOptions,
  PlacementBindOptions,
  PlacementUnbindOptions,
} from '@/modules/bitrix/application/interfaces/placements/placement.interface';

@Injectable()
export class BitrixPlacementsAdapter implements BitrixPlacementsPort {
  private readonly logger = new WinstonLogger(
    BitrixPlacementsAdapter.name,
    'bitrix:placements'.split(':'),
  );

  constructor(
    @Inject(B24PORTS.BITRIX)
    private readonly bitrixService: BitrixPort,
  ) {}

  /**
   * Register new placement handler
   *
   * ---
   *
   * Регистрирует новый обработчик виджета
   * @param params
   */
  async bind(params: PlacementBindOptions) {
    try {
      const response = await this.bitrixService.callMethod<
        PlacementBindOptions,
        boolean
      >('placement.bind', params);

      return response?.result ?? false;
    } catch (error) {
      this.logger.error(error);
      return false;
    }
  }

  /**
   * Remove placement handler
   *
   * ---
   *
   * Удаляет обработчик виджета
   * @param fields
   */
  async unbind(fields: PlacementUnbindDto) {
    try {
      const response = await this.bitrixService.callMethod<
        PlacementUnbindOptions,
        { count: number }
      >('placement.unbind', fields);

      return response?.result?.count ?? 0;
    } catch (error) {
      this.logger.error(error);
      return 0;
    }
  }

  /**
   * Get registered placement list
   *
   * ---
   *
   * Получить список зарегистрированных обработчиков
   */
  public async getBoundPlacementList() {
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
