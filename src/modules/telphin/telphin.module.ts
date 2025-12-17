import { forwardRef, Module } from '@nestjs/common';
import { telphinProviders } from '@/modules/telphin/telphin.providers';
import { RedisModule } from '@/modules/redis/redis.module';
import { TokensModule } from '@/modules/tokens/tokens.module';
import { TelphinApiService } from '@/modules/telphin/telphin-api.service';
import { TelphinService } from '@/modules/telphin/telphin.service';
import { BitrixModule } from '@/modules/bitrix/bitrix.module';
import { TelphinController } from '@/modules/telphin/telphin.controller';

@Module({
  imports: [RedisModule, TokensModule, forwardRef(() => BitrixModule)],
  controllers: [TelphinController],
  providers: [...telphinProviders, TelphinApiService, TelphinService],
  exports: [TelphinService],
})
export class TelphinModule {}
