import bitrixConfig from './bitrix.config';
import redisConfig from './redis.config';
import databaseConfig from './database.config';
import applicationConfig from './app.config';
import headHunterConfig from './headhunter.config';
import wikiConfig from './wiki.config';
import avitoConfig from './avito.config';
import telphinConfig from './telphin.config';
import grampusConfig from './grampus.config';
import yandexConfig from './yadnex.config';
import microservicesConfig from './microservices.config';
import addyInternalConfig from './addy-internal.config';

export const IS_PROD = process.env.NODE_ENV == 'production';

export const configList = [
  bitrixConfig,
  redisConfig,
  databaseConfig,
  applicationConfig,
  headHunterConfig,
  wikiConfig,
  avitoConfig,
  telphinConfig,
  grampusConfig,
  yandexConfig,
  microservicesConfig,
  addyInternalConfig,
];
