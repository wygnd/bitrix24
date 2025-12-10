import { EventOnDto } from '@/modules/bitrix/modules/events/dtos/event.dto';
import { EventsLeadDeleteData } from '@/modules/bitrix/modules/events/interfaces/events-lead.interface';

export class EventLeadDeleteDto extends EventOnDto<EventsLeadDeleteData> {}
