import { Inject, Injectable } from '@nestjs/common';
import type { BitrixEventsPort } from '@/modules/bitrix/application/ports/events/events.port';
import {
  B24EventAdd,
  B24EventItem,
} from '@/modules/bitrix/application/interfaces/events/events.interface';
import { B24EventRemoveDto } from '@/modules/bitrix/application/dtos/events/event-remove.dto';
import { WinstonLogger } from '@/config/winston.logger';
import { B24PORTS } from '@/modules/bitrix/bitrix.constants';
import type { BitrixPort } from '@/modules/bitrix/application/ports/common/bitrix.port';

@Injectable()
export class BitrixEventsAdapter implements BitrixEventsPort {
  private readonly logger = new WinstonLogger(
    BitrixEventsAdapter.name,
    'bitrix:events'.split(':'),
  );

  constructor(
    @Inject(B24PORTS.BITRIX)
    private readonly bitrixService: BitrixPort,
  ) {}

  /**
   * Create new event listener
   *
   * ---
   *
   * Добавить новый обработчки событий
   * @param fields
   */
  async addEvent(fields: B24EventAdd) {
    return (
      (
        await this.bitrixService.callMethod<B24EventAdd, boolean>(
          'event.bind',
          fields,
        )
      ).result ?? false
    );
  }

  /**
   * Get event listeners list
   *
   * ---
   *
   * Получить список обработчиков событий
   */
  async getEventList() {
    try {
      const response = await this.bitrixService.callMethod<any, B24EventItem[]>(
        'event.get',
      );

      return response?.result ?? [];
    } catch (error) {
      this.logger.error(error);
      return [];
    }
  }

  /**
   * Remove event listener
   *
   * ---
   *
   * Удалить обработчик события
   * @param fields
   */
  async removeEvent(fields: B24EventRemoveDto) {
    try {
      const response = await this.bitrixService.callMethod<any, boolean>(
        'event.unbind',
        fields,
      );

      return response?.result ?? false;
    } catch (error) {
      this.logger.error(error);
      return false;
    }
  }
}
