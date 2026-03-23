import { EventOnDto } from '@/modules/bitrix/application/dtos/events/event.dto';
import { EventsLeadDeleteData } from '@/modules/bitrix/application/interfaces/events/events-lead.interface';

export class EventLeadDeleteDto extends EventOnDto<EventsLeadDeleteData> {}
