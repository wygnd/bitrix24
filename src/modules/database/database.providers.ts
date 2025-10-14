import { ConfigService } from '@nestjs/config';
import { Sequelize, SequelizeOptions } from 'sequelize-typescript';
import { AuthModel } from '../auth/auth.entity';

export const databaseProviders = [
  {
    isGlobal: true,
    provide: 'SEQUELIZE',
    useFactory: async (configService: ConfigService) => {
      const sequelize = new Sequelize(
        configService.get<SequelizeOptions>('databaseConfig'),
      );
      sequelize.addModels([AuthModel]);
      await sequelize.sync({
        force: false,
        alter: false,
      });
      return sequelize;
    },
    inject: [ConfigService],
  },
];
