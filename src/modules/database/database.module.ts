import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SequelizeOptions } from 'sequelize-typescript';
import { DEVELOPMENT, PRODUCTION } from '@/constants';
import { DatabaseConfig } from '@/common/interfaces/database-config.interface';
import { SequelizeModule } from '@nestjs/sequelize';
import { B24WikiClientPaymentsModel } from '@/modules/bitrix/infrastructure/database/entities/wiki/wiki-client-payments.entity';
import { BitrixHeadhunterVacancyModel } from '@/modules/bitrix/infrastructure/database/entities/headhunter/headhunter-vacancy.entity';
import { TokensModel } from '@/modules/tokens/tokens.entity';
import { LeadUpsellModel } from '@/modules/bitrix/infrastructure/database/entities/leads/lead-upsell.entity';
import { LeadObserveManagerCallingModel } from '@/modules/bitrix/infrastructure/database/entities/leads/lead-observe-manager-calling.entity';

@Module({
  imports: [
    SequelizeModule.forRootAsync({
      useFactory: async (configService: ConfigService) => {
        let config: SequelizeOptions;
        const configObject =
          configService.get<DatabaseConfig>('databaseConfig');

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

        return {
          dialect: 'postgres',
          ...config,
          autoLoadModels: true,
          models: [
            TokensModel,
            B24WikiClientPaymentsModel,
            BitrixHeadhunterVacancyModel,
            LeadUpsellModel,
            LeadObserveManagerCallingModel,
          ],
          synchronize: true,
        };
      },
      inject: [ConfigService],
    }),
  ],
  providers: [],
  exports: [],
})
export class DatabaseModule {}
