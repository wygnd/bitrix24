import { OnImCommandAddDto } from '@/modules/bitirx/modules/imbot/dtos/imbot-events.dto';
import { B24EventTaskUpdateData } from '@/modules/bitirx/modules/events/interfaces/events.interface';

export class EventHandleUpdateTaskDto extends OnImCommandAddDto<B24EventTaskUpdateData> {}
