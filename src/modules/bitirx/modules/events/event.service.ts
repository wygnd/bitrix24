import { Injectable } from '@nestjs/common';
import { B24EventAdd } from '@/modules/bitirx/modules/events/interfaces/events.interface';
import { BitrixService } from '@/modules/bitirx/bitrix.service';

@Injectable()
export class BitrixEventService {
  constructor(private readonly bitrixService: BitrixService) {}

  async addEvent(fields: B24EventAdd) {
    return (
      await this.bitrixService.callMethod<B24EventAdd, boolean>(
        'event.bind',
        fields,
      )
    ).result ?? false;
  }
}
