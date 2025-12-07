import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { CronService } from '@/modules/cron/cron.service';
import { BitrixModule } from '@/modules/bitirx/bitrix.module';

@Module({
  imports: [ScheduleModule.forRoot({}), BitrixModule],
  providers: [CronService],
})
export class CronModule {}
