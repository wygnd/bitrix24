import { Module } from '@nestjs/common';
import { bitrixProviders } from './bitrix.providers';
import { BitrixController } from './bitrix.controller';
import { BitrixService } from './bitrix.service';
import { BitrixUserService } from './methods/user/user.service';
import { BitrixLeadService } from './methods/lead/lead.service';
import { BitrixMessageService } from './methods/im/im.service';
import { BitrixImBotService } from './methods/imbot/imbot.service';
import { AppHttpModule } from '../http/http.module';

@Module({
  imports: [AppHttpModule],
  controllers: [BitrixController],
  providers: [
    BitrixService,
    BitrixUserService,
    BitrixLeadService,
    BitrixMessageService,
    BitrixImBotService,
  ],
})
export class BitrixModule {}
