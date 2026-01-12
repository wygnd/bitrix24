import { B24EventTaskUpdateData } from '@/modules/bitrix/application/interfaces/events/events.interface';
import { EventOnDto } from '@/modules/bitrix/application/dtos/events/event.dto';

export class EventHandleUpdateTaskDto extends EventOnDto<B24EventTaskUpdateData> {}
