import { Injectable } from '@nestjs/common';
import { BitrixAbstractAdapter } from '@/modules/bitrix/infrastructure/abstract.adapter';
import type { BitrixEventsPort } from '@/modules/bitrix/application/ports/events.port';
import {
  B24EventAdd,
  B24EventItem,
} from '@/modules/bitrix/modules/events/interfaces/events.interface';
import { B24EventRemoveDto } from '@/modules/bitrix/modules/events/dtos/event-remove.dto';
import { BitrixService } from '@/modules/bitrix/bitrix.service';
import { WinstonLogger } from '@/config/winston.logger';

@Injectable()
export class BitrixEventsAdapter
  extends BitrixAbstractAdapter
  implements BitrixEventsPort
{
  private readonly logger = new WinstonLogger(
    BitrixEventsAdapter.name,
    'bitrix:events'.split(':'),
  );

  constructor(private readonly bitrixService: BitrixService) {
    super(bitrixService);
  }

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
