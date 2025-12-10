import { B24EventTaskUpdateData } from '@/modules/bitrix/modules/events/interfaces/events.interface';
import { EventOnDto } from '@/modules/bitrix/modules/events/dtos/event.dto';

export class EventHandleUpdateTaskDto extends EventOnDto<B24EventTaskUpdateData> {}
