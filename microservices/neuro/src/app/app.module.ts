import { Module } from '@nestjs/common';
import { AppController } from './controllers/controller';
import { AppService } from './services/service';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { join } from 'path';
import { configList } from '../common/config/main';
import { AppHttpService } from './services/http.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: configList,
    }),
    HttpModule,
  ],
  controllers: [AppController],
  providers: [AppHttpService, AppService],
})
export class AppModule {}
