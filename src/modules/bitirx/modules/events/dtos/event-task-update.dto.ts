import { B24EventTaskUpdateData } from '@/modules/bitirx/modules/events/interfaces/events.interface';
import { EventOnDto } from '@/modules/bitirx/modules/events/dtos/event.dto';

export class EventHandleUpdateTaskDto extends EventOnDto<B24EventTaskUpdateData> {}
