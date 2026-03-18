import { Module } from '@nestjs/common';
import { YandexDirectService } from '@/modules/yandex/services/direct.service';
import { RedisModule } from '@/modules/redis/redis.module';

@Module({
  imports: [RedisModule],
  providers: [YandexDirectService],
  exports: [YandexDirectService],
})
export class YandexModule {}
