import { Module } from '@nestjs/common';
import { tokensProviders } from '@/modules/tokens/tokens.providers';
import { TokensService } from '@/modules/tokens/tokens.service';
import { RedisModule } from '@/modules/redis/redis.module';

@Module({
  imports: [RedisModule],
  providers: [...tokensProviders, TokensService],
  exports: [TokensService],
})
export class TokensModule {}
