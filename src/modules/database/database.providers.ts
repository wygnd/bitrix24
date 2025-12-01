import { ConfigService } from '@nestjs/config';
import { Sequelize, SequelizeOptions } from 'sequelize-typescript';
import { DEVELOPMENT, PRODUCTION } from '@/constants';
import { DatabaseConfig } from '@/common/interfaces/database-config.interface';
import { LeadObserveManagerCallingModel } from '@/modules/bitirx/modules/lead/entities/lead-observe-manager-calling.entity';

export const databaseProviders = [
  {
    isGlobal: true,
    provide: 'SEQUELIZE',
    useFactory: async (configService: ConfigService) => {
      let config: SequelizeOptions;
      const configObject = configService.get<DatabaseConfig>('databaseConfig');

      if (!configObject)
        throw new Error('DATABASE MODULE: Invalid database config');

      switch (process.env.NODE_ENV) {
        case DEVELOPMENT:
          config = configObject?.development ?? {};
          break;

        case PRODUCTION:
          config = configObject?.production ?? {};
          break;

        default:
          config = configObject?.development ?? {};
          break;
      }

      if (Object.keys(config).length === 0)
        throw new Error('DATABASE MODULE: Invalid database config');

      const sequelize = new Sequelize(config);
      sequelize.addModels([LeadObserveManagerCallingModel]);
      await sequelize.sync({
        force: false,
        alter: false,
      });
      return sequelize;
    },
    inject: [ConfigService],
  },
];
