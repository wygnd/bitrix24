import {
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BitrixService } from '@/modules/bitrix/bitrix.service';
import { RedisService } from '@/modules/redis/redis.service';
import { REDIS_KEYS } from '@/modules/redis/redis.constants';
import {
  B24Task,
  B24TaskExtended,
  B24TaskSelect,
} from '@/modules/bitrix/application/interfaces/tasks/tasks.interface';
import { B24BatchResponseMap } from '@/modules/bitrix/interfaces/bitrix-api.interface';
import { B24TaskResult } from '@/modules/bitrix/application/interfaces/tasks/tasks-result.interface';
import { ImbotHandleApproveSmmAdvertLayout } from '@/modules/bitrix/modules/imbot/interfaces/imbot-handle.interface';
import { B24ImKeyboardOptions } from '@/modules/bitrix/modules/im/interfaces/im.interface';
import { BitrixImBotService } from '@/modules/bitrix/modules/imbot/imbot.service';
import { WinstonLogger } from '@/config/winston.logger';

@Injectable()
export class BitrixTaskService {
  private readonly logger = new WinstonLogger(
    BitrixTaskService.name,
    'bitrix:services'.split(':'),
  );

  constructor(
    private readonly bitrixService: BitrixService,
    private readonly redisService: RedisService,
    @Inject(forwardRef(() => BitrixImBotService))
    private readonly botService: BitrixImBotService,
  ) {}
}
