import { BitrixAbstractPort } from '@/modules/bitrix/application/ports/abstract.port';
import {
  B24EventAdd,
  B24EventItem,
} from '@/modules/bitrix/modules/events/interfaces/events.interface';
import { B24EventRemoveDto } from '@/modules/bitrix/modules/events/dtos/event-remove.dto';

export interface BitrixEventsPort extends BitrixAbstractPort {
  addEvent(fields: B24EventAdd): Promise<boolean>;
  getEventList(): Promise<B24EventItem[]>;
  removeEvent(fields: B24EventRemoveDto): Promise<boolean>;
}
