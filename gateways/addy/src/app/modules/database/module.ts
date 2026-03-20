import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { IEnvironmentOptions } from '@shared/interfaces/config/main';
import { B24AddyClientsModel } from '../bitrix/api/infrastructure/persistence/models/addy/clients/model';

@Module({
  imports: [
    SequelizeModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService<IEnvironmentOptions>) => {
        const config = configService.getOrThrow('database', { infer: true });

        return {
          dialect: 'postgres',
          autoLoadModels: true,
          synchronize: true,
          ...config,
          dialectOptions: {
            useUTC: false,
          },
          timezone: '+03:30',
          alert: true,
        };
      },
      inject: [ConfigService],
    }),
  ],
})
export class DatabaseModule {}
