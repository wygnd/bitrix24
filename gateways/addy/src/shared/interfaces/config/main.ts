import { IEnvironmentRedisOptions } from '@shared/interfaces/config/redis/main';
import { IEnvironmentBitrixOptions } from '@shared/interfaces/config/bitrix/main';
import { IEnvironmentAppOptions } from '@shared/interfaces/config/app/main';
import { IEnvironmentDatabaseOptions } from '@shared/interfaces/config/database/main';

export interface IEnvironmentOptions {
  application: IEnvironmentAppOptions;
  bitrix: IEnvironmentBitrixOptions;
  redis: IEnvironmentRedisOptions;
  database: IEnvironmentDatabaseOptions;
}
