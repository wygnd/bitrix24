import { Module } from '@nestjs/common';
import { TokensService } from '@/modules/tokens/tokens.service';
import { RedisModule } from '@/modules/redis/redis.module';
import { SequelizeModule } from '@nestjs/sequelize';
import { TokensModel } from '@/modules/tokens/tokens.entity';

@Module({
  imports: [RedisModule, SequelizeModule.forFeature([TokensModel])],
  providers: [TokensService],
  exports: [TokensService],
})
export class TokensModule {}
