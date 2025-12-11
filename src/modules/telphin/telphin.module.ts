import { Module } from '@nestjs/common';
import { telphinProviders } from '@/modules/telphin/telphin.providers';
import { RedisModule } from '@/modules/redis/redis.module';
import { TokensModule } from '@/modules/tokens/tokens.module';
import { TelphinService } from '@/modules/telphin/telphin.service';

@Module({
  imports: [RedisModule, TokensModule],
  controllers: [],
  providers: [...telphinProviders, TelphinService],
  exports: [],
})
export class TelphinModule {}
