import { Module } from '@nestjs/common';
import { YandexDirectService } from '@/modules/yandex/services/direct.service';
import { RedisModule } from '@/modules/redis/redis.module';
import { RobotsModule } from '@/shared/microservices/modules/robots/module';

@Module({
  imports: [RedisModule, RobotsModule],
  providers: [YandexDirectService],
  exports: [YandexDirectService],
})
export class YandexModule {}
