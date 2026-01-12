import { ConfigService } from '@nestjs/config';
import { Sequelize, SequelizeOptions } from 'sequelize-typescript';
import { DEVELOPMENT, PRODUCTION } from '@/constants';
import { DatabaseConfig } from '@/common/interfaces/database-config.interface';
import { LeadObserveManagerCallingModel } from '@/modules/bitrix/infrastructure/database/entities/leads/lead-observe-manager-calling.entity';
import { TokensModel } from '@/modules/tokens/tokens.entity';
import { LeadUpsellModel } from '@/modules/bitrix/infrastructure/database/entities/leads/lead-upsell.entity';
import { B24WikiClientPaymentsModel } from '@/modules/bitrix/infrastructure/database/entities/wiki/wiki-client-payments.entity';

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
      sequelize.addModels([
        LeadObserveManagerCallingModel,
        TokensModel,
        LeadUpsellModel,
        B24WikiClientPaymentsModel,
      ]);

      // important: depends on change db structure
      await sequelize.sync({
        force: false,
        alter: false,
      });
      return sequelize;
    },
    inject: [ConfigService],
  },
];
