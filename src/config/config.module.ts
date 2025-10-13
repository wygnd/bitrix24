import { ConfigModule } from '@nestjs/config';
import { Module } from '@nestjs/common';
import { configList } from '../common/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: configList,
    }),
  ],
})
export class ConfigAppModule {}
