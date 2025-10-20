import { Injectable } from '@nestjs/common';
import { OnImCommandAddDto } from './events.dto';

@Injectable()
export class BitrixEventService {
  constructor() {}

  async handleEvent(eventData: OnImCommandAddDto) {
    const { event, data } = eventData;

    if (event !== 'ONIMCOMMANDADD') throw new Error('Invalid event');

    const { PARAMS } = data;
  }
}
