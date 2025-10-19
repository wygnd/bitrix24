import { forwardRef, Module } from '@nestjs/common';
import { BitrixController } from './bitrix.controller';
import { BitrixService } from './bitrix.service';
import { BitrixUserService } from './methods/user/user.service';
import { BitrixLeadService } from './methods/lead/lead.service';
import { BitrixMessageService } from './methods/im/im.service';
import { BitrixImBotService } from './methods/imbot/imbot.service';
import { AppHttpModule } from '../http/http.module';
import { RedisModule } from '../redis/redis.module';
import { BitrixAvitoController } from './controllers/bitrix-avito.controller';

@Module({
  imports: [forwardRef(() => AppHttpModule), RedisModule],
  controllers: [BitrixController, BitrixAvitoController],
  providers: [
    BitrixService,
    BitrixUserService,
    BitrixLeadService,
    BitrixMessageService,
    BitrixImBotService,
  ],
  exports: [BitrixService],
})
export class BitrixModule {}
