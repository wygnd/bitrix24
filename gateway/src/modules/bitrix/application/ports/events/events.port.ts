import {
  B24EventAdd,
  B24EventItem,
} from '@/modules/bitrix/application/interfaces/events/events.interface';
import { B24EventRemoveDto } from '@/modules/bitrix/application/dtos/events/event-remove.dto';

export interface BitrixEventsPort {
  addEvent(fields: B24EventAdd): Promise<boolean>;
  getEventList(): Promise<B24EventItem[]>;
  removeEvent(fields: B24EventRemoveDto): Promise<boolean>;
}
