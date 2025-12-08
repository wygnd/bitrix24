import type { B24EventList } from '@/modules/bitirx/modules/events/interfaces/events.interface';
import { IsNotEmpty, IsString } from 'class-validator';

export class B24EventRemoveDto {
  @IsNotEmpty()
  @IsString()
  event: B24EventList;

  @IsNotEmpty()
  @IsString()
  handler: string;
}
